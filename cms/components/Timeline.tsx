"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, X, Check, Calendar } from "lucide-react";
import clsx from "clsx";
import type { TimelineItem, TimelineCategory, TimelineStatus } from "@/lib/types";

// ── Config ────────────────────────────────────────────────────────────────────

const CATEGORIES: TimelineCategory[] = ["Milestone", "Product", "Marketing", "Finance", "Team", "Other"];

const CAT_COLORS: Record<TimelineCategory, { dot: string; badge: string }> = {
  Milestone: { dot: "bg-amber-400",   badge: "bg-amber-400/10 text-amber-400 border-amber-400/20"   },
  Product:   { dot: "bg-blue-400",    badge: "bg-blue-400/10 text-blue-400 border-blue-400/20"      },
  Marketing: { dot: "bg-orange-400",  badge: "bg-orange-400/10 text-orange-400 border-orange-400/20" },
  Finance:   { dot: "bg-emerald-400", badge: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" },
  Team:      { dot: "bg-purple-400",  badge: "bg-purple-400/10 text-purple-400 border-purple-400/20" },
  Other:     { dot: "bg-zinc-500",    badge: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"       },
};

const STATUS_NEXT: Record<TimelineStatus, TimelineStatus> = {
  "planned":     "in-progress",
  "in-progress": "completed",
  "completed":   "delayed",
  "delayed":     "planned",
};

const STATUS_LABEL: Record<TimelineStatus, string> = {
  "planned":     "Planned",
  "in-progress": "In Progress",
  "completed":   "Completed",
  "delayed":     "Delayed",
};

const STATUS_CLS: Record<TimelineStatus, string> = {
  "planned":     "bg-zinc-700/50 text-zinc-400",
  "in-progress": "bg-blue-500/10 text-blue-400",
  "completed":   "bg-emerald-500/10 text-emerald-400",
  "delayed":     "bg-red-500/10 text-red-400",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function monthLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

// ── Empty form ────────────────────────────────────────────────────────────────

const emptyForm = (): Omit<TimelineItem, "id" | "createdAt" | "updatedAt"> => ({
  title: "",
  date: new Date().toISOString().slice(0, 10),
  endDate: "",
  category: "Milestone",
  status: "planned",
  description: "",
});

// ── Item form (add / edit) ────────────────────────────────────────────────────

function ItemForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial: Omit<TimelineItem, "id" | "createdAt" | "updatedAt">;
  onSave: (v: Omit<TimelineItem, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [v, setV] = useState(initial);
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => { titleRef.current?.focus(); }, []);

  const set = (k: keyof typeof v, val: string) => setV(prev => ({ ...prev, [k]: val }));

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-3">
      <input
        ref={titleRef}
        placeholder="Title"
        value={v.title}
        onChange={e => set("title", e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") onSave(v); if (e.key === "Escape") onCancel(); }}
        className="w-full bg-zinc-800 text-zinc-100 text-sm rounded-lg px-3 py-2 outline-none border border-zinc-700 focus:border-red-500/60 placeholder-zinc-600"
      />

      <div className="flex gap-2 flex-wrap">
        <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
          <label className="text-xs text-zinc-600">Start date</label>
          <input type="date" value={v.date} onChange={e => set("date", e.target.value)}
            className="bg-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 outline-none border border-zinc-700 focus:border-red-500/60" />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
          <label className="text-xs text-zinc-600">End date (optional)</label>
          <input type="date" value={v.endDate || ""} onChange={e => set("endDate", e.target.value)}
            className="bg-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 outline-none border border-zinc-700 focus:border-red-500/60" />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <select value={v.category} onChange={e => set("category", e.target.value as TimelineCategory)}
          className="bg-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 outline-none border border-zinc-700 focus:border-red-500/60 flex-1">
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={v.status} onChange={e => set("status", e.target.value as TimelineStatus)}
          className="bg-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 outline-none border border-zinc-700 focus:border-red-500/60 flex-1">
          {(Object.keys(STATUS_LABEL) as TimelineStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      <textarea
        placeholder="Notes (optional, markdown supported)"
        value={v.description || ""}
        onChange={e => set("description", e.target.value)}
        rows={3}
        className="w-full bg-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 outline-none border border-zinc-700 focus:border-red-500/60 placeholder-zinc-600 resize-none"
      />

      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} disabled={loading}
          className="px-4 py-1.5 text-sm text-zinc-500 hover:text-zinc-300 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors">
          Cancel
        </button>
        <button onClick={() => onSave(v)} disabled={loading || !v.title.trim()}
          className="px-4 py-1.5 text-sm bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1.5">
          <Check size={13} /> {loading ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── Single timeline item ──────────────────────────────────────────────────────

function TimelineCard({
  item,
  sha,
  onUpdate,
  onDelete,
}: {
  item: TimelineItem;
  sha?: string;
  onUpdate: (updated: TimelineItem) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const colors = CAT_COLORS[item.category];

  async function cycleStatus() {
    setLoading(true);
    const updated = { ...item, status: STATUS_NEXT[item.status] };
    const res = await fetch("/api/timeline", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item: updated, sha }),
    });
    setLoading(false);
    if ((await res.json()).success) onUpdate(updated);
  }

  async function saveEdit(v: Omit<TimelineItem, "id" | "createdAt" | "updatedAt">) {
    setLoading(true);
    const updated: TimelineItem = { ...item, ...v, updatedAt: new Date().toISOString() };
    const res = await fetch("/api/timeline", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item: updated, sha }),
    });
    setLoading(false);
    if ((await res.json()).success) { onUpdate(updated); setEditing(false); }
  }

  async function doDelete() {
    setLoading(true);
    const res = await fetch("/api/timeline", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, sha }),
    });
    setLoading(false);
    if ((await res.json()).success) onDelete(item.id);
  }

  if (editing) {
    return (
      <ItemForm
        initial={{ title: item.title, date: item.date, endDate: item.endDate, category: item.category, status: item.status, description: item.description }}
        onSave={saveEdit}
        onCancel={() => setEditing(false)}
        loading={loading}
      />
    );
  }

  return (
    <div className="relative pl-6">
      {/* Timeline dot */}
      <button
        onClick={cycleStatus}
        disabled={loading}
        title={`Status: ${STATUS_LABEL[item.status]} — click to cycle`}
        className={clsx(
          "absolute left-0 top-3 w-3 h-3 rounded-full border-2 border-zinc-950 transition-transform hover:scale-125",
          colors.dot,
          item.status === "completed" && "opacity-50",
        )}
      />

      <div
        className={clsx(
          "border rounded-xl transition-colors",
          expanded ? "border-zinc-700 bg-zinc-900/60" : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700",
        )}
      >
        {/* Header row */}
        <div
          className="flex items-start gap-3 px-4 py-3 cursor-pointer"
          onClick={() => setExpanded(v => !v)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={clsx(
                "text-sm font-medium",
                item.status === "completed" ? "line-through text-zinc-500" : "text-zinc-100",
              )}>
                {item.title}
              </span>
              <span className={clsx("text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0", colors.badge)}>
                {item.category}
              </span>
              <span className={clsx("text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0", STATUS_CLS[item.status])}>
                {STATUS_LABEL[item.status]}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-zinc-500">
              <Calendar size={10} />
              {formatDate(item.date)}
              {item.endDate && <> → {formatDate(item.endDate)}</>}
            </div>
          </div>
          {expanded ? <ChevronUp size={14} className="text-zinc-600 mt-1 shrink-0" /> : <ChevronDown size={14} className="text-zinc-600 mt-1 shrink-0" />}
        </div>

        {/* Expanded body */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-zinc-800">
            {item.description ? (
              <p className="text-sm text-zinc-400 mt-3 whitespace-pre-wrap leading-relaxed">{item.description}</p>
            ) : (
              <p className="text-xs text-zinc-600 mt-3 italic">No notes</p>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditing(true)} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors">
                <Pencil size={11} /> Edit
              </button>
              <button onClick={doDelete} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:text-red-400 border border-zinc-700 hover:border-red-500/30 rounded-lg transition-colors">
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Timeline component ───────────────────────────────────────────────────

export default function Timeline() {
  const [items,   setItems]   = useState<TimelineItem[]>([]);
  const [sha,     setSha]     = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [filter,  setFilter]  = useState<TimelineCategory | "All">("All");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/timeline");
    const data = await res.json();
    if (data.items) { setItems(data.items); setSha(data.sha); }
    setLoading(false);
  }

  async function addItem(v: Omit<TimelineItem, "id" | "createdAt" | "updatedAt">) {
    if (!v.title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/timeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item: v, sha }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.item) {
      setItems(prev => [...prev, data.item].sort((a, b) => a.date.localeCompare(b.date)));
      setAdding(false);
      // refresh sha
      load();
    }
  }

  function handleUpdate(updated: TimelineItem) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i).sort((a, b) => a.date.localeCompare(b.date)));
    load(); // refresh sha
  }

  function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    load();
  }

  const filtered = filter === "All" ? items : items.filter(i => i.category === filter);

  // Group by month
  const groups: { month: string; items: TimelineItem[] }[] = [];
  for (const item of filtered) {
    const m = monthLabel(item.date);
    const last = groups[groups.length - 1];
    if (last?.month === m) last.items.push(item);
    else groups.push({ month: m, items: [item] });
  }

  return (
    <div className="px-6 md:px-8 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Timeline</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Track what's being built and what's coming next</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors shrink-0"
        >
          <Plus size={14} /> Add item
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        {(["All", ...CATEGORIES] as const).map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={clsx(
              "px-2.5 py-1 text-xs rounded-full border transition-colors",
              filter === c
                ? "bg-red-700 text-white border-red-600"
                : "text-zinc-500 border-zinc-700 hover:text-zinc-300 hover:border-zinc-600",
            )}>
            {c}
          </button>
        ))}
      </div>

      {/* Add form */}
      {adding && (
        <div className="mb-6">
          <ItemForm initial={emptyForm()} onSave={addItem} onCancel={() => setAdding(false)} loading={saving} />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-zinc-600 text-sm">Loading…</div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && !adding && (
        <div className="text-center py-20 text-zinc-600">
          <p className="text-sm">No items yet.</p>
          <button onClick={() => setAdding(true)} className="mt-3 text-sm text-red-500 hover:text-red-400">
            + Add your first milestone
          </button>
        </div>
      )}

      {/* Timeline */}
      {!loading && groups.length > 0 && (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[5px] top-0 bottom-0 w-px bg-zinc-800" />

          <div className="space-y-8">
            {groups.map(({ month, items: groupItems }) => (
              <div key={month}>
                <div className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-3 pl-6">
                  {month}
                </div>
                <div className="space-y-3">
                  {groupItems.map(item => (
                    <TimelineCard
                      key={item.id}
                      item={item}
                      sha={sha}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
