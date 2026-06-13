"use client";
import { useState, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, CalendarDays, LayoutGrid,
  X, User, Clock, Calendar, ArrowRight, Video, CheckCircle2,
  Circle, Timer,
} from "lucide-react";
import clsx from "clsx";
import type { Task, Meeting, TaskStatus } from "@/lib/types";

export interface CalEvent {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  time?: string;
  type: "task" | "meeting";
  status?: TaskStatus;
}

const STATUS_COLOR: Record<TaskStatus, string> = {
  "todo":        "bg-zinc-600/90 text-zinc-200",
  "in-progress": "bg-amber-500/80 text-amber-100",
  "done":        "bg-emerald-600/80 text-emerald-100",
};
const STATUS_LABEL: Record<TaskStatus, string> = {
  "todo": "To Do", "in-progress": "In Progress", "done": "Done",
};
const STATUS_DOT: Record<TaskStatus, string> = {
  "todo": "bg-zinc-500", "in-progress": "bg-amber-400", "done": "bg-emerald-500",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function startOfWeek(d: Date) {
  const r = new Date(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  return r;
}
function isInRange(day: string, start: string, end?: string) {
  return end ? day >= start && day <= end : day === start;
}
function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_SHORT   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ── Event detail modal ────────────────────────────────────────────────────────

function EventModal({
  event, task, meeting, onClose,
}: {
  event: CalEvent;
  task?: Task;
  meeting?: Meeting;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={clsx(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
              event.type === "task" ? "bg-zinc-800" : "bg-blue-600/20",
            )}>
              {event.type === "task"
                ? (event.status === "done"
                    ? <CheckCircle2 size={15} className="text-emerald-400" />
                    : event.status === "in-progress"
                      ? <Timer size={15} className="text-amber-400" />
                      : <Circle size={15} className="text-zinc-400" />)
                : <Video size={15} className="text-blue-400" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-zinc-100 leading-snug">{event.title}</h3>
              <span className="text-xs text-zinc-500 capitalize">
                {event.type === "task" ? "Task" : "Meeting"}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 shrink-0 mt-0.5">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 space-y-3">
          {/* Task details */}
          {task && (
            <>
              {task.status && (
                <div className="flex items-center gap-2">
                  <div className={clsx("w-2 h-2 rounded-full shrink-0", STATUS_DOT[task.status])} />
                  <span className={clsx(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    STATUS_COLOR[task.status],
                  )}>
                    {STATUS_LABEL[task.status]}
                  </span>
                </div>
              )}
              {task.description && (
                <p className="text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 pt-3">
                  {task.description}
                </p>
              )}
              <div className="flex flex-wrap gap-3 pt-1">
                {task.assignee && (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <User size={12} className="text-zinc-600" /> {task.assignee}
                  </span>
                )}
                {(task.startDate || task.dueDate) && (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Calendar size={12} className="text-zinc-600" />
                    {task.startDate && task.dueDate
                      ? <>{fmtDate(task.startDate)} <ArrowRight size={10} className="text-zinc-700" /> {fmtDate(task.dueDate)}</>
                      : fmtDate(task.startDate ?? task.dueDate!)}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Meeting details */}
          {meeting && (
            <>
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Calendar size={12} className="text-zinc-600" /> {fmtDate(meeting.date)}
                </span>
                {meeting.time && (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock size={12} className="text-zinc-600" /> {meeting.time}
                    {meeting.duration && ` · ${meeting.duration < 60 ? meeting.duration + "m" : meeting.duration / 60 + "h"}`}
                  </span>
                )}
                {meeting.attendees && (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <User size={12} className="text-zinc-600" /> {meeting.attendees}
                  </span>
                )}
              </div>
              {meeting.notes && (
                <p className="text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 pt-3">
                  {meeting.notes}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Event chip ────────────────────────────────────────────────────────────────

function EventChip({ event, onSelect }: { event: CalEvent; onSelect: () => void }) {
  const base = "text-xs px-1.5 py-0.5 rounded truncate max-w-full cursor-pointer hover:opacity-80 transition-opacity";
  if (event.type === "meeting") {
    return (
      <div onClick={e => { e.stopPropagation(); onSelect(); }}
        className={clsx(base, "bg-blue-600/80 text-blue-100")} title={event.title}>
        {event.time && <span className="opacity-70 mr-1">{event.time}</span>}
        {event.title}
      </div>
    );
  }
  return (
    <div onClick={e => { e.stopPropagation(); onSelect(); }}
      className={clsx(base, STATUS_COLOR[event.status ?? "todo"])} title={event.title}>
      {event.title}
    </div>
  );
}

// ── Monthly view ──────────────────────────────────────────────────────────────

function MonthlyView({ year, month, events, onSelect }: {
  year: number; month: number; events: CalEvent[]; onSelect: (e: CalEvent) => void;
}) {
  const today = ymd(new Date());
  const firstDay   = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_SHORT.map(d => (
          <div key={d} className="text-center text-xs font-medium text-zinc-600 py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-zinc-800 rounded-xl overflow-hidden border border-zinc-800">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="bg-zinc-950 min-h-[80px] md:min-h-[96px]" />;
          const d = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = events.filter(e => isInRange(d, e.startDate, e.endDate));
          const isToday = d === today;
          return (
            <div key={i} className={clsx("bg-zinc-950 p-1 min-h-[80px] md:min-h-[96px]", isToday && "bg-zinc-900/80")}>
              <span className={clsx(
                "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1",
                isToday ? "bg-red-600 text-white" : "text-zinc-500",
              )}>{day}</span>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(e => (
                  <EventChip key={e.id + d} event={e} onSelect={() => onSelect(e)} />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-zinc-600 pl-1">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Weekly view ───────────────────────────────────────────────────────────────

function WeeklyView({ weekStart, events, onSelect }: {
  weekStart: Date; events: CalEvent[]; onSelect: (e: CalEvent) => void;
}) {
  const today = ymd(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  return (
    <div>
      <div className="grid grid-cols-7 gap-px mb-1">
        {days.map((day, i) => {
          const isToday = ymd(day) === today;
          return (
            <div key={i} className="text-center py-2">
              <div className="text-xs text-zinc-600 mb-1">{DAY_SHORT[i]}</div>
              <span className={clsx(
                "text-sm font-medium w-8 h-8 mx-auto flex items-center justify-center rounded-full",
                isToday ? "bg-red-600 text-white" : "text-zinc-400",
              )}>{day.getDate()}</span>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 gap-px bg-zinc-800 rounded-xl overflow-hidden border border-zinc-800">
        {days.map((day, i) => {
          const d = ymd(day);
          const dayEvents = events.filter(e => isInRange(d, e.startDate, e.endDate));
          const isToday = d === today;
          return (
            <div key={i} className={clsx("bg-zinc-950 p-1.5 min-h-[160px]", isToday && "bg-zinc-900/80")}>
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
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props { tasks: Task[]; meetings: Meeting[] }

export default function Calendar({ tasks, meetings }: Props) {
  const [view, setView]         = useState<"monthly" | "weekly">("monthly");
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const now = new Date();
  const [year, setYear]         = useState(now.getFullYear());
  const [month, setMonth]       = useState(now.getMonth());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(now));

  const events = useMemo<CalEvent[]>(() => [
    ...tasks.filter(t => t.startDate || t.dueDate).map(t => ({
      id: t.id, title: t.title,
      startDate: t.startDate ?? t.dueDate!,
      endDate: t.startDate && t.dueDate ? t.dueDate : undefined,
      type: "task" as const, status: t.status,
    })),
    ...meetings.map(m => ({
      id: m.id, title: m.title, startDate: m.date,
      time: m.time, type: "meeting" as const,
    })),
  ], [tasks, meetings]);

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

  // Resolve full task/meeting for the selected event
  const selTask    = selectedEvent?.type === "task"    ? tasks.find(t => t.id === selectedEvent.id)    : undefined;
  const selMeeting = selectedEvent?.type === "meeting" ? meetings.find(m => m.id === selectedEvent.id) : undefined;

  return (
    <div>
      {/* Event detail popup */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          task={selTask}
          meeting={selMeeting}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={prevPeriod} className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-lg font-semibold text-zinc-100 w-52 text-center">{label}</h2>
          <button onClick={nextPeriod} className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
            <ChevronRight size={18} />
          </button>
          <button onClick={goToday} className="ml-2 px-3 py-1.5 text-xs text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-600 hover:text-zinc-200 transition-colors">
            Today
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-zinc-600 inline-block"/>To Do</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"/>In Progress</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"/>Done</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600 inline-block"/>Meeting</span>
        </div>
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

      {view === "monthly"
        ? <MonthlyView year={year} month={month} events={events} onSelect={setSelectedEvent} />
        : <WeeklyView weekStart={weekStart} events={events} onSelect={setSelectedEvent} />}
    </div>
  );
}
