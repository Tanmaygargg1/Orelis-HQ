"use client";
import { useEffect, useState } from "react";
import { Plus, X, RefreshCw, Calendar, User, GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { Task, TaskStatus } from "@/lib/types";

const COLUMNS: { id: TaskStatus; label: string; dot: string }[] = [
  { id: "todo", label: "To Do", dot: "bg-zinc-500" },
  { id: "in-progress", label: "In Progress", dot: "bg-amber-400" },
  { id: "done", label: "Done", dot: "bg-red-500" },
];

function TaskCard({ task, onDelete, overlay = false }: { task: Task; onDelete?: (id: string) => void; overlay?: boolean }) {
  return (
    <div className={clsx(
      "bg-zinc-900 border rounded-lg p-3 transition-colors group select-none",
      overlay ? "border-red-500/50 shadow-2xl rotate-1 scale-105" : "border-zinc-800 hover:border-zinc-700"
    )}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-zinc-200 leading-snug flex-1">{task.title}</p>
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all shrink-0 mt-0.5"
          >
            <X size={13} />
          </button>
        )}
      </div>
      {task.description && (
        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">{task.description}</p>
      )}
      <div className="flex items-center gap-3 mt-2 flex-wrap">
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
    </div>
  );
}

function DraggableCard({ task, onDelete }: { task: Task; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...attributes}
      className={clsx("relative", isDragging && "opacity-30")}
    >
      <div
        {...listeners}
        className="absolute left-2 top-3 text-zinc-700 hover:text-zinc-500 cursor-grab active:cursor-grabbing z-10"
      >
        <GripVertical size={14} />
      </div>
      <div className="pl-4">
        <TaskCard task={task} onDelete={onDelete} />
      </div>
    </div>
  );
}

function DroppableColumn({
  col,
  tasks,
  isOver,
  onDelete,
}: {
  col: typeof COLUMNS[number];
  tasks: Task[];
  isOver: boolean;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: col.id });
  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className={clsx("w-2 h-2 rounded-full", col.dot)} />
        <span className="text-sm font-medium text-zinc-300">{col.label}</span>
        <span className="text-xs text-zinc-600 ml-1">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={clsx(
          "flex-1 overflow-y-auto space-y-2 pr-1 rounded-xl min-h-24 transition-colors p-1",
          isOver ? "bg-zinc-800/60 ring-1 ring-red-500/30" : "bg-transparent"
        )}
      >
        {tasks.map((task) => (
          <DraggableCard key={task.id} task={task} onDelete={onDelete} />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-zinc-700 py-6 text-center">Drop tasks here</p>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sha, setSha] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor)
  );

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
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: { title, description, assignee, dueDate: dueDate || undefined, status: "todo" },
        sha,
      }),
    });
    setSaving(false);
    await loadTasks();
    setTitle(""); setDescription(""); setAssignee(""); setDueDate("");
    setShowModal(false);
  }

  async function handleStatusChange(id: string, status: TaskStatus) {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
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

  function handleDragStart({ active }: DragStartEvent) {
    setActiveTask(tasks.find((t) => t.id === active.id) ?? null);
  }

  function handleDragOver({ over }: any) {
    setOverId(over?.id ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);
    setOverId(null);
    if (!over) return;
    handleStatusChange(active.id as string, over.id as TaskStatus);
  }

  const inputCls = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-colors";

  return (
    <div className="px-6 py-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Tasks</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Drag cards between columns to update status.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-500 transition-colors font-medium"
        >
          <Plus size={15} /> Add task
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm">
          <RefreshCw size={14} className="animate-spin" /> Loading…
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 flex-1 min-h-0">
            {COLUMNS.map((col) => (
              <DroppableColumn
                key={col.id}
                col={col}
                tasks={tasks.filter((t) => t.status === col.id)}
                isOver={overId === col.id}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} overlay />}
          </DragOverlay>
        </DndContext>
      )}

      {/* Add task modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-semibold text-zinc-100">New task</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-600 hover:text-zinc-400">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="px-5 pb-5 space-y-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Title *</label>
                <input autoFocus type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} required />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Assignee</label>
                  <input type="text" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Name" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Due date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors">
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
