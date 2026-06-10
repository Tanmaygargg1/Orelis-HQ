"use client";
import { useEffect, useState } from "react";
import { Plus, X, RefreshCw, GripVertical, Calendar, User } from "lucide-react";
import clsx from "clsx";
import type { Task, TaskStatus } from "@/lib/types";

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "To Do", color: "bg-zinc-100 text-zinc-600" },
  { id: "in-progress", label: "In Progress", color: "bg-blue-100 text-blue-700" },
  { id: "done", label: "Done", color: "bg-green-100 text-green-700" },
];

function TaskCard({
  task,
  onStatusChange,
  onDelete,
}: {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-zinc-800 leading-snug flex-1">{task.title}</p>
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-400 transition-all shrink-0"
        >
          <X size={13} />
        </button>
      </div>
      {task.description && (
        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">{task.description}</p>
      )}
      <div className="flex items-center gap-3 mt-2.5 flex-wrap">
        {task.assignee && (
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <User size={11} /> {task.assignee}
          </span>
        )}
        {task.dueDate && (
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <Calendar size={11} /> {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
      {/* Move buttons */}
      <div className="flex gap-1 mt-2.5 flex-wrap">
        {COLUMNS.filter((c) => c.id !== task.status).map((col) => (
          <button
            key={col.id}
            onClick={() => onStatusChange(task.id, col.id)}
            className={clsx("text-xs px-2 py-0.5 rounded-full transition-colors", col.color)}
          >
            → {col.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sha, setSha] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New task form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadTasks() {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    if (data.tasks) setTasks(data.tasks);
    if (data.sha) setSha(data.sha);
    setLoading(false);
  }

  useEffect(() => { loadTasks(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: { title, description, assignee, dueDate: dueDate || undefined, status: "todo" },
        sha,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.task) {
      await loadTasks();
      setTitle(""); setDescription(""); setAssignee(""); setDueDate("");
      setShowModal(false);
    }
  }

  async function handleStatusChange(id: string, status: TaskStatus) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: { ...task, status }, sha }),
    });
    await loadTasks();
  }

  async function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, sha }),
    });
    await loadTasks();
  }

  return (
    <div className="px-6 py-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Tasks</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Track work across the team.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors font-medium"
        >
          <Plus size={15} /> Add task
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <RefreshCw size={14} className="animate-spin" /> Loading…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <span className={clsx("text-xs font-semibold px-2.5 py-1 rounded-full", col.color)}>
                    {col.label}
                  </span>
                  <span className="text-xs text-zinc-400">{colTasks.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <p className="text-xs text-zinc-400 py-4 text-center">No tasks here</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add task modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-semibold text-zinc-900">New task</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="px-5 pb-5 space-y-3">
              <div>
                <label className="block text-sm text-zinc-600 mb-1">Title *</label>
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-600 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-600 mb-1">Assignee</label>
                  <input
                    type="text"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    placeholder="Name"
                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-600 mb-1">Due date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Adding…" : "Add task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
