"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, CalendarDays, LayoutGrid,
  X, User, Clock, Calendar as CalIcon, ArrowRight, Video,
  Plus, Pencil, Trash2, GitBranch,
} from "lucide-react";
import clsx from "clsx";
import type { Task, Meeting, TimelineItem } from "@/lib/types";
import { broadcastRefresh, useRefreshListener } from "@/lib/refresh";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CalEvent {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  time?: string;
  type: "task" | "meeting" | "timeline";
  category?: string;
}

// ── Colour scheme ─────────────────────────────────────────────────────────────

const TASK_CLS    = "bg-zinc-700/70 text-zinc-300";
const MEETING_CLS = "bg-blue-600/80 text-blue-100";

const TIMELINE_CAT_CLS: Record<string, string> = {
  Milestone: "bg-amber-500/30 text-amber-200 border border-amber-500/20",
  Product:   "bg-indigo-500/30 text-indigo-200 border border-indigo-500/20",
  Marketing: "bg-orange-500/30 text-orange-200 border border-orange-500/20",
  Finance:   "bg-emerald-500/30 text-emerald-200 border border-emerald-500/20",
  Team:      "bg-purple-500/30 text-purple-200 border border-purple-500/20",
  Other:     "bg-slate-500/30 text-slate-300 border border-slate-500/20",
};

function eventCls(event: CalEvent) {
  if (event.type === "meeting")  return MEETING_CLS;
  if (event.type === "timeline") return TIMELINE_CAT_CLS[event.category ?? "Other"] ?? TIMELINE_CAT_CLS.Other;
  return TASK_CLS;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function startOfWeek(d: Date) { const r = new Date(d); r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); return r; }
function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_SHORT   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DURATIONS   = [{ value:15, label:"15 min" },{ value:30, label:"30 min" },{ value:45, label:"45 min" },{ value:60, label:"1 hour" },{ value:90, label:"1.5 hr" },{ value:120, label:"2 hours" }];

// ── Lane-packing for span bars ────────────────────────────────────────────────
// Returns [colStart 1-indexed, colEnd exclusive] or null if event doesn't overlap week.
function barCols(event: CalEvent, week: (string | null)[]): [number, number] | null {
  if (!event.endDate || event.endDate <= event.startDate) return null;
  const nonNull = week.filter(Boolean) as string[];
  if (!nonNull.length) return null;
  const weekFirst = nonNull[0], weekLast = nonNull[nonNull.length - 1];
  if (event.startDate > weekLast || event.endDate < weekFirst) return null;

  let cs = week.findIndex(d => d !== null && d >= event.startDate);
  if (cs === -1) cs = week.findIndex(d => d !== null)!;

  let ce = -1;
  for (let i = 6; i >= 0; i--) { if (week[i] !== null && week[i]! <= event.endDate) { ce = i; break; } }
  if (ce === -1) ce = week.findLastIndex(d => d !== null);

  return [cs + 1, ce + 2];
}

// Assign events to lanes so non-overlapping events share a row.
function assignLanes(items: { event: CalEvent; cs: number; ce: number }[]) {
  const lanes: { cs: number; ce: number }[][] = [];
  return items.map(item => {
    const laneIdx = lanes.findIndex(lane =>
      lane.every(e => item.cs >= e.ce || item.ce <= e.cs)
    );
    const lane = laneIdx === -1 ? lanes.length : laneIdx;
    if (laneIdx === -1) lanes.push([{ cs: item.cs, ce: item.ce }]);
    else lanes[laneIdx].push({ cs: item.cs, ce: item.ce });
    return { ...item, lane };
  });
}

// ── Span bars section (used by both views) ────────────────────────────────────
function SpanBars({ weekMulti, week, onSelect }: {
  weekMulti: CalEvent[];
  week: (string | null)[];
  onSelect: (e: CalEvent) => void;
}) {
  if (!weekMulti.length) return null;
  const nonNull = week.filter(Boolean) as string[];
  const weekFirst = nonNull[0], weekLast = nonNull[nonNull.length - 1];

  const withCols = weekMulti
    .map(event => { const cols = barCols(event, week); return cols ? { event, cs: cols[0], ce: cols[1] } : null; })
    .filter(Boolean) as { event: CalEvent; cs: number; ce: number }[];

  const laned = assignLanes(withCols);
  const numLanes = laned.length ? Math.max(...laned.map(l => l.lane)) + 1 : 0;
  if (!numLanes) return null;

  return (
    <div className="bg-zinc-950 px-px pt-1 pb-0.5"
      style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridTemplateRows: `repeat(${numLanes}, 20px)`, gap: "2px" }}>
      {laned.map(({ event, cs, ce, lane }) => {
        const startsHere = event.startDate >= weekFirst;
        const endsHere   = (event.endDate ?? "") <= weekLast;
        return (
          <div
            key={event.id}
            style={{ gridColumn: `${cs} / ${ce}`, gridRow: lane + 1 }}
            onClick={e => { e.stopPropagation(); onSelect(event); }}
            title={event.title}
            className={clsx(
              "text-xs px-2 h-5 leading-5 truncate cursor-pointer hover:opacity-80 transition-opacity",
              startsHere ? "rounded-l-full" : "rounded-l-none",
              endsHere   ? "rounded-r-full" : "rounded-r-none",
              eventCls(event),
            )}
          >
            {startsHere
              ? <><span className="opacity-60 mr-1">{eventLabel(event)}</span>{event.title}</>
              : <span className="opacity-50">↳ {event.title}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── Meeting modal (create / edit) ─────────────────────────────────────────────

function MeetingModal({
  meeting, sha, defaultDate, onClose,
}: {
  meeting?: Meeting;
  sha?: string;
  defaultDate?: string;
  onClose: () => void;
}) {
  const isEdit = !!meeting;
  const [title,     setTitle]    = useState(meeting?.title     ?? "");
  const [date,      setDate]     = useState(meeting?.date      ?? defaultDate ?? "");
  const [time,      setTime]     = useState(meeting?.time      ?? "");
  const [duration,  setDuration] = useState(meeting?.duration  ?? 60);
  const [attendees, setAttendees]= useState(meeting?.attendees ?? "");
  const [notes,     setNotes]    = useState(meeting?.notes     ?? "");
  const [saving,    setSaving]   = useState(false);

  const cls = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { title, date, time: time || undefined, duration, attendees: attendees || undefined, notes: notes || undefined };
    await fetch("/api/meetings", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { meeting: { ...meeting, ...payload }, sha } : { meeting: payload, sha }),
    });
    setSaving(false);
    broadcastRefresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0 bg-zinc-900 z-10">
          <h2 className="font-semibold text-zinc-100">{isEdit ? "Edit meeting" : "New meeting"}</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} className="px-5 pb-6 space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Title *</label>
            <input autoFocus type="text" value={title} onChange={e => setTitle(e.target.value)} className={cls} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={cls} required />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className={cls} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Duration</label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map(d => (
                <button key={d.value} type="button" onClick={() => setDuration(d.value)}
                  className={clsx("px-3 py-1.5 text-sm rounded-lg border transition-colors",
                    duration === d.value ? "border-red-500 bg-red-500/10 text-red-400" : "border-zinc-700 text-zinc-400 hover:border-zinc-600")}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Attendees</label>
            <input type="text" value={attendees} onChange={e => setAttendees(e.target.value)}
              placeholder="Names or emails, comma-separated" className={cls} />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className={`${cls} resize-none`} placeholder="Agenda, links, context…" />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300">Cancel</button>
            <button type="submit" disabled={saving || !title || !date}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Event detail modal ────────────────────────────────────────────────────────

function EventModal({
  event, task, meeting, timelineItem, sha, onClose, onEdit, onDelete,
}: {
  event: CalEvent;
  task?: Task;
  meeting?: Meeting;
  timelineItem?: TimelineItem;
  sha?: string;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    if (event.type === "meeting" && meeting) {
      await fetch("/api/meetings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: meeting.id, sha }),
      });
      broadcastRefresh();
    }
    setDeleting(false);
    onDelete();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
              event.type === "timeline" ? "bg-amber-500/20" : event.type === "meeting" ? "bg-blue-600/20" : "bg-zinc-800")}>
              {event.type === "timeline" ? <GitBranch size={15} className="text-amber-400" />
                : event.type === "meeting" ? <Video size={15} className="text-blue-400" />
                : <CalIcon size={15} className="text-zinc-400" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-zinc-100 leading-snug">{event.title}</h3>
              <span className="text-xs text-zinc-500 capitalize">
                {event.type === "timeline" ? `Timeline · ${event.category}` : event.type}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 shrink-0 mt-0.5"><X size={16} /></button>
        </div>

        <div className="px-5 pb-5 space-y-3">
          {task && (
            <>
              {task.description && <p className="text-sm text-zinc-400 leading-relaxed">{task.description}</p>}
              <div className="flex flex-wrap gap-3">
                {task.assignee && <span className="flex items-center gap-1.5 text-xs text-zinc-500"><User size={12} className="text-zinc-600" /> {task.assignee}</span>}
                {(task.startDate || task.dueDate) && (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <CalIcon size={12} className="text-zinc-600" />
                    {task.startDate && task.dueDate
                      ? <>{fmtDate(task.startDate)} <ArrowRight size={10} className="text-zinc-700" /> {fmtDate(task.dueDate)}</>
                      : fmtDate(task.startDate ?? task.dueDate!)}
                  </span>
                )}
              </div>
            </>
          )}

          {meeting && (
            <>
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 text-xs text-zinc-500"><CalIcon size={12} className="text-zinc-600" /> {fmtDate(meeting.date)}</span>
                {meeting.time && (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock size={12} className="text-zinc-600" /> {meeting.time}
                    {meeting.duration && ` · ${meeting.duration < 60 ? meeting.duration + "m" : meeting.duration / 60 + "h"}`}
                  </span>
                )}
                {meeting.attendees && <span className="flex items-center gap-1.5 text-xs text-zinc-500"><User size={12} className="text-zinc-600" /> {meeting.attendees}</span>}
              </div>
              {meeting.notes && <p className="text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 pt-3">{meeting.notes}</p>}
              <div className="flex gap-2 pt-2 border-t border-zinc-800">
                <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors">
                  <Pencil size={11} /> Edit
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:text-red-400 border border-zinc-700 hover:border-red-500/30 rounded-lg transition-colors">
                  <Trash2 size={11} /> {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </>
          )}

          {timelineItem && (
            <>
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <CalIcon size={12} className="text-zinc-600" /> {fmtDate(timelineItem.date)}
                  {timelineItem.endDate && <> <ArrowRight size={10} className="text-zinc-700" /> {fmtDate(timelineItem.endDate)}</>}
                </span>
              </div>
              <div className="flex gap-2">
                <span className={clsx("text-[10px] px-1.5 py-0.5 rounded border",
                  TIMELINE_CAT_CLS[timelineItem.category] ?? TIMELINE_CAT_CLS.Other)}>{timelineItem.category}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-400 capitalize">{timelineItem.status}</span>
              </div>
              {timelineItem.description && <p className="text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 pt-3">{timelineItem.description}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Event chip (single-day, inside a cell) ────────────────────────────────────

function eventLabel(event: CalEvent): string {
  if (event.type === "meeting")  return event.time ? `${event.time} ·` : "Meeting ·";
  if (event.type === "timeline") return `${event.category ?? "Timeline"} ·`;
  return "Task ·";
}

function EventChip({ event, onSelect }: { event: CalEvent; onSelect: () => void }) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onSelect(); }}
      title={event.title}
      className={clsx("text-xs px-1.5 py-0.5 rounded truncate max-w-full cursor-pointer hover:opacity-80 transition-opacity", eventCls(event))}>
      <span className="opacity-60 mr-1">{eventLabel(event)}</span>{event.title}
    </div>
  );
}

// ── Monthly view ──────────────────────────────────────────────────────────────

function MonthlyView({ year, month, events, onSelect, onDayClick }: {
  year: number; month: number; events: CalEvent[];
  onSelect: (e: CalEvent) => void; onDayClick: (date: string) => void;
}) {
  const today = ymd(new Date());
  const firstDay    = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const allDays: (string | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`),
  ];
  while (allDays.length % 7 !== 0) allDays.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < allDays.length; i += 7) weeks.push(allDays.slice(i, i + 7));

  const multiDayEvents = events.filter(e => e.endDate && e.endDate > e.startDate);
  const singleEvents   = events.filter(e => !e.endDate || e.endDate <= e.startDate);

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-zinc-800">
        {DAY_SHORT.map(d => (
          <div key={d} className="text-center text-xs font-medium text-zinc-600 py-2">{d}</div>
        ))}
      </div>

      {weeks.map((week, wi) => {
        const nonNull   = week.filter(Boolean) as string[];
        if (!nonNull.length) return null;
        const weekFirst = nonNull[0], weekLast = nonNull[nonNull.length - 1];
        const weekMulti = multiDayEvents.filter(e =>
          e.startDate <= weekLast && (e.endDate ?? e.startDate) >= weekFirst);

        // Events that span 2+ columns or are continuations get a bar lane.
        // 1-column starters fall back to a chip so they don't create a mostly-empty bar row.
        const spanMulti = weekMulti.filter(e => {
          const cols = barCols(e, week);
          if (!cols) return false;
          return (cols[1] - cols[0]) >= 2 || e.startDate < weekFirst;
        });
        const chipMulti = weekMulti.filter(e => {
          const cols = barCols(e, week);
          if (!cols) return false;
          return (cols[1] - cols[0]) < 2 && e.startDate >= weekFirst;
        });

        return (
          <div key={wi} className="border-b border-zinc-800 last:border-b-0">
            <SpanBars weekMulti={spanMulti} week={week} onSelect={onSelect} />
            <div className="grid grid-cols-7 gap-px bg-zinc-800">
              {week.map((day, i) => {
                if (!day) return <div key={i} className="bg-zinc-950 min-h-[72px] md:min-h-[80px]" />;
                const dayEvents = [
                  ...singleEvents.filter(e => e.startDate === day),
                  ...chipMulti.filter(e => e.startDate === day),
                ];
                const isToday   = day === today;
                return (
                  <div key={i} onClick={() => onDayClick(day)}
                    className={clsx("bg-zinc-950 p-1 min-h-[72px] md:min-h-[80px] group/cell cursor-pointer hover:bg-zinc-900/60 transition-colors",
                      isToday && "bg-zinc-900/80")}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={clsx("text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                        isToday ? "bg-red-600 text-white" : "text-zinc-500")}>
                        {parseInt(day.split("-")[2])}
                      </span>
                      <button onClick={e => { e.stopPropagation(); onDayClick(day); }}
                        className="opacity-0 group-hover/cell:opacity-100 transition-opacity p-0.5 text-zinc-600 hover:text-zinc-400">
                        <Plus size={11} />
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map(e => (
                        <EventChip key={e.id + day} event={e} onSelect={() => onSelect(e)} />
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-zinc-600 pl-1">+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Weekly view ───────────────────────────────────────────────────────────────

function WeeklyView({ weekStart, events, onSelect, onDayClick }: {
  weekStart: Date; events: CalEvent[];
  onSelect: (e: CalEvent) => void; onDayClick: (date: string) => void;
}) {
  const today = ymd(new Date());
  const days  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const week  = days.map(d => ymd(d));
  const weekFirst = week[0], weekLast = week[6];

  const multiDayEvents = events.filter(e => e.endDate && e.endDate > e.startDate);
  const singleEvents   = events.filter(e => !e.endDate || e.endDate <= e.startDate);
  const weekMulti = multiDayEvents.filter(e =>
    e.startDate <= weekLast && (e.endDate ?? e.startDate) >= weekFirst);

  const spanMulti = weekMulti.filter(e => {
    const cols = barCols(e, week);
    if (!cols) return false;
    return (cols[1] - cols[0]) >= 2 || e.startDate < weekFirst;
  });
  const chipMulti = weekMulti.filter(e => {
    const cols = barCols(e, week);
    if (!cols) return false;
    return (cols[1] - cols[0]) < 2 && e.startDate >= weekFirst;
  });

  return (
    <div>
      <div className="grid grid-cols-7 gap-px mb-1">
        {days.map((day, i) => {
          const isToday = ymd(day) === today;
          return (
            <div key={i} className="text-center py-2">
              <div className="text-xs text-zinc-600 mb-1">{DAY_SHORT[i]}</div>
              <span className={clsx("text-sm font-medium w-8 h-8 mx-auto flex items-center justify-center rounded-full",
                isToday ? "bg-red-600 text-white" : "text-zinc-400")}>
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        {spanMulti.length > 0 && (
          <div className="border-b border-zinc-800">
            <SpanBars weekMulti={spanMulti} week={week} onSelect={onSelect} />
          </div>
        )}
        <div className="grid grid-cols-7 gap-px bg-zinc-800">
          {days.map((day, i) => {
            const d = ymd(day);
            const dayEvents = [
              ...singleEvents.filter(e => e.startDate === d),
              ...chipMulti.filter(e => e.startDate === d),
            ];
            const isToday   = d === today;
            return (
              <div key={i} onClick={() => onDayClick(d)}
                className={clsx("bg-zinc-950 p-1.5 min-h-[160px] cursor-pointer hover:bg-zinc-900/60 transition-colors group/cell",
                  isToday && "bg-zinc-900/80")}>
                <div className="flex justify-end mb-1">
                  <button onClick={e => { e.stopPropagation(); onDayClick(d); }}
                    className="opacity-0 group-hover/cell:opacity-100 transition-opacity p-0.5 text-zinc-600 hover:text-zinc-400">
                    <Plus size={11} />
                  </button>
                </div>
                <div className="space-y-1">
                  {dayEvents.length === 0
                    ? <div className="flex items-center justify-center py-6"><span className="text-xs text-zinc-800">—</span></div>
                    : dayEvents.map(e => <EventChip key={e.id + d} event={e} onSelect={() => onSelect(e)} />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Calendar component ───────────────────────────────────────────────────

export default function Calendar() {
  const [tasks,         setTasks]         = useState<Task[]>([]);
  const [meetings,      setMeetings]      = useState<Meeting[]>([]);
  const [meetingsSha,   setMeetingsSha]   = useState<string | undefined>();
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [meetingModal,  setMeetingModal]  = useState<{ date?: string; meeting?: Meeting } | null>(null);

  const now = new Date();
  const [view,      setView]      = useState<"monthly" | "weekly">("monthly");
  const [year,      setYear]      = useState(now.getFullYear());
  const [month,     setMonth]     = useState(now.getMonth());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(now));

  const load = useCallback(async () => {
    setLoading(true);
    const [tr, mr, tlr] = await Promise.all([
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/meetings").then(r => r.json()),
      fetch("/api/timeline").then(r => r.json()),
    ]);
    if (tr.tasks)    setTasks(tr.tasks);
    if (mr.meetings) setMeetings(mr.meetings);
    if (mr.sha)      setMeetingsSha(mr.sha);
    if (tlr.items)   setTimelineItems(tlr.items);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useRefreshListener(load);

  const events = useMemo<CalEvent[]>(() => [
    ...tasks.filter(t => t.startDate || t.dueDate).map(t => ({
      id: t.id, title: t.title,
      startDate: t.startDate ?? t.dueDate!,
      endDate: t.startDate && t.dueDate && t.dueDate > t.startDate ? t.dueDate : undefined,
      type: "task" as const,
    })),
    ...meetings.map(m => ({
      id: m.id, title: m.title, startDate: m.date, time: m.time, type: "meeting" as const,
    })),
    ...timelineItems.map(tl => ({
      id: tl.id, title: tl.title, startDate: tl.date,
      endDate: tl.endDate && tl.endDate > tl.date ? tl.endDate : undefined,
      type: "timeline" as const, category: tl.category,
    })),
  ], [tasks, meetings, timelineItems]);

  function prevPeriod() {
    if (view === "monthly") { month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1); }
    else setWeekStart(w => addDays(w, -7));
  }
  function nextPeriod() {
    if (view === "monthly") { month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1); }
    else setWeekStart(w => addDays(w, 7));
  }
  function goToday() { setYear(now.getFullYear()); setMonth(now.getMonth()); setWeekStart(startOfWeek(now)); }

  const weekEnd = addDays(weekStart, 6);
  const label   = view === "monthly"
    ? `${MONTH_NAMES[month]} ${year}`
    : `${weekStart.toLocaleDateString("en-GB",{day:"numeric",month:"short"})} – ${weekEnd.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}`;

  const selTask         = selectedEvent?.type === "task"     ? tasks.find(t => t.id === selectedEvent.id)         : undefined;
  const selMeeting      = selectedEvent?.type === "meeting"  ? meetings.find(m => m.id === selectedEvent.id)      : undefined;
  const selTimelineItem = selectedEvent?.type === "timeline" ? timelineItems.find(t => t.id === selectedEvent.id) : undefined;

  return (
    <div>
      {selectedEvent && (
        <EventModal
          event={selectedEvent} task={selTask} meeting={selMeeting} timelineItem={selTimelineItem}
          sha={meetingsSha} onClose={() => setSelectedEvent(null)}
          onEdit={() => { setMeetingModal({ meeting: selMeeting }); setSelectedEvent(null); }}
          onDelete={() => { load(); setSelectedEvent(null); }}
        />
      )}
      {meetingModal !== null && (
        <MeetingModal
          meeting={meetingModal.meeting} sha={meetingsSha} defaultDate={meetingModal.date}
          onClose={() => { setMeetingModal(null); load(); }}
        />
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={prevPeriod} className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"><ChevronLeft size={18} /></button>
          <h2 className="text-lg font-semibold text-zinc-100 w-52 text-center">{label}</h2>
          <button onClick={nextPeriod} className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"><ChevronRight size={18} /></button>
          <button onClick={goToday} className="ml-2 px-3 py-1.5 text-xs text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-600 hover:text-zinc-200 transition-colors">Today</button>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-zinc-500 inline-block"/>Task</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/>Meeting</span>
          <span className="text-zinc-700">·</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>Milestone</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block"/>Product</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block"/>Marketing</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/>Finance</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block"/>Team</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMeetingModal({ date: ymd(new Date()) })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors">
            <Plus size={14} /> New meeting
          </button>
          <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
            <button onClick={() => setView("monthly")}
              className={clsx("flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
                view==="monthly" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}>
              <LayoutGrid size={14}/> Month
            </button>
            <button onClick={() => setView("weekly")}
              className={clsx("flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
                view==="weekly" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}>
              <CalendarDays size={14}/> Week
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-zinc-600 text-sm">Loading…</div>
      ) : view === "monthly"
        ? <MonthlyView year={year} month={month} events={events} onSelect={setSelectedEvent}
            onDayClick={d => setMeetingModal({ date: d })} />
        : <WeeklyView weekStart={weekStart} events={events} onSelect={setSelectedEvent}
            onDayClick={d => setMeetingModal({ date: d })} />}
    </div>
  );
}
