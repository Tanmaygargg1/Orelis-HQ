"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, X, RefreshCw, Clock, Users, FileText, Pencil, Trash2, Video } from "lucide-react";
import clsx from "clsx";
import type { Meeting } from "@/lib/types";
import { broadcastRefresh, useRefreshListener } from "@/lib/refresh";

const DURATIONS = [
  { value: 15,  label: "15 min"  },
  { value: 30,  label: "30 min"  },
  { value: 45,  label: "45 min"  },
  { value: 60,  label: "1 hour"  },
  { value: 90,  label: "1.5 hr"  },
  { value: 120, label: "2 hours" },
];

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function MeetingModal({
  meeting, sha, onClose,
}: { meeting?: Meeting; sha?: string; onClose: () => void }) {
  const isEdit = !!meeting;
  const [title,     setTitle]     = useState(meeting?.title     ?? "");
  const [date,      setDate]      = useState(meeting?.date      ?? "");
  const [time,      setTime]      = useState(meeting?.time      ?? "");
  const [duration,  setDuration]  = useState<number>(meeting?.duration ?? 60);
  const [attendees, setAttendees] = useState(meeting?.attendees ?? "");
  const [notes,     setNotes]     = useState(meeting?.notes     ?? "");
  const [saving,    setSaving]    = useState(false);

  const inputCls = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-colors";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { title, date, time: time || undefined, duration, attendees: attendees || undefined, notes: notes || undefined };
    if (isEdit) {
      await fetch("/api/meetings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting: { ...meeting, ...payload }, sha }),
      });
    } else {
      await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting: payload, sha }),
      });
    }
    setSaving(false);
    broadcastRefresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0 bg-zinc-900 z-10">
          <h2 className="font-semibold text-zinc-100">{isEdit ? "Edit meeting" : "New meeting"}</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} className="px-5 pb-6 space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Title *</label>
            <input autoFocus type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Duration</label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map(d => (
                <button key={d.value} type="button" onClick={() => setDuration(d.value)}
                  className={clsx("px-3 py-1.5 text-sm rounded-lg border transition-colors",
                    duration === d.value
                      ? "border-red-500 bg-red-500/10 text-red-400"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-600")}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Attendees</label>
            <input type="text" value={attendees} onChange={e => setAttendees(e.target.value)}
              placeholder="Names or emails, comma-separated" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className={`${inputCls} resize-none`} placeholder="Agenda, links, context…" />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MeetingCard({ meeting, sha, onEdit, onDelete }: {
  meeting: Meeting; sha?: string; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <Video size={14} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-zinc-200 truncate">{meeting.title}</h3>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-zinc-500">{formatDate(meeting.date)}</span>
              {meeting.time && (
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Clock size={11} /> {meeting.time}
                  {meeting.duration && ` · ${meeting.duration < 60 ? meeting.duration + "m" : meeting.duration / 60 + "h"}`}
                </span>
              )}
              {meeting.attendees && (
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Users size={11} /> {meeting.attendees}
                </span>
              )}
            </div>
            {meeting.notes && (
              <p className="text-xs text-zinc-600 mt-2 leading-relaxed line-clamp-2">{meeting.notes}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onEdit} className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [sha, setSha]           = useState<string | undefined>();
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<"new" | Meeting | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/meetings");
    const data = await res.json();
    if (data.meetings) setMeetings(data.meetings);
    if (data.sha)      setSha(data.sha);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useRefreshListener(load);

  async function handleDelete(id: string) {
    await fetch("/api/meetings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, sha }),
    });
    broadcastRefresh();
    load();
  }

  // Group by date
  const sorted = [...meetings].sort((a, b) => a.date.localeCompare(b.date));
  const groups: Record<string, Meeting[]> = {};
  sorted.forEach(m => { groups[m.date] = [...(groups[m.date] ?? []), m]; });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = Object.entries(groups).filter(([d]) => d >= today);
  const past     = Object.entries(groups).filter(([d]) => d < today).reverse();

  return (
    <div className="px-6 md:px-8 py-8 max-w-3xl">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Meetings</h1>
          <p className="text-zinc-500 text-sm mt-1">Meetings appear on the Calendar.</p>
        </div>
        <button onClick={() => setModal("new")}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-500 transition-colors font-medium shrink-0">
          <Plus size={15} /> New meeting
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-600 text-sm">
          <RefreshCw size={14} className="animate-spin" /> Loading…
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">
          <Video size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No meetings yet. Add one to see it on the calendar.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map(([date, items]) => (
                  <div key={date}>
                    <p className="text-xs text-zinc-600 mb-2 ml-1">{formatDate(date)}</p>
                    <div className="space-y-2">
                      {items.map(m => (
                        <MeetingCard key={m.id} meeting={m} sha={sha}
                          onEdit={() => setModal(m)} onDelete={() => handleDelete(m.id)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Past</h2>
              <div className="space-y-3 opacity-60">
                {past.map(([date, items]) => (
                  <div key={date}>
                    <p className="text-xs text-zinc-600 mb-2 ml-1">{formatDate(date)}</p>
                    <div className="space-y-2">
                      {items.map(m => (
                        <MeetingCard key={m.id} meeting={m} sha={sha}
                          onEdit={() => setModal(m)} onDelete={() => handleDelete(m.id)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {modal && (
        <MeetingModal
          meeting={modal === "new" ? undefined : modal}
          sha={sha}
          onClose={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
