"use client";
import { useState } from "react";
import Link from "next/link";
import {
  DndContext, DragOverlay, useDraggable, useDroppable,
  PointerSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Folder, FileText, GripVertical, ArrowUp, Loader2,
  Building2, Megaphone, BarChart3, Layers, Users, Lightbulb,
} from "lucide-react";
import clsx from "clsx";
import type { FileItem } from "@/lib/types";

// Sector folder styling
const SECTOR: Record<string, { border: string; icon: React.ElementType; iconColor: string }> = {
  "Business Information": { border: "border-red-500/30 bg-red-500/5 hover:border-red-500/50",   icon: Building2,  iconColor: "text-red-400"     },
  "Marketing":            { border: "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50", icon: Megaphone,  iconColor: "text-amber-400"   },
  "Finance":              { border: "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50", icon: BarChart3, iconColor: "text-emerald-400" },
  "Product":              { border: "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50",  icon: Layers,     iconColor: "text-blue-400"    },
  "Team":                 { border: "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50", icon: Users,   iconColor: "text-purple-400"  },
  "Ideas":                { border: "border-zinc-500/30 bg-zinc-500/5 hover:border-zinc-500/50",  icon: Lightbulb,  iconColor: "text-zinc-400"    },
};

// ── Single card ──────────────────────────────────────────────────────

function ItemCard({ item, isDropTarget }: { item: FileItem; isDropTarget: boolean }) {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({ id: item.path });
  const { setNodeRef: setDropRef } = useDroppable({ id: item.path });

  // Folders are both draggable and droppable
  const setRef = (el: HTMLDivElement | null) => {
    setDragRef(el);
    if (item.type === "dir") setDropRef(el);
  };

  const sector = item.type === "dir" ? SECTOR[item.name] : undefined;
  const FolderIcon = sector?.icon ?? Folder;

  return (
    <div
      ref={setRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={clsx("relative group", isDragging && "opacity-25 pointer-events-none")}
    >
      {/* Drop ring on hovered folder */}
      {isDropTarget && item.type === "dir" && (
        <div className="absolute inset-0 rounded-xl ring-2 ring-red-500 ring-offset-2 ring-offset-zinc-950 pointer-events-none z-10" />
      )}

      {/* Drag handle — only appears on hover */}
      <div
        {...listeners}
        {...attributes}
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1.5 text-zinc-600 hover:text-zinc-400 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} />
      </div>

      <Link
        href={`/content/${item.path}`}
        className={clsx(
          "flex items-center gap-3 p-4 pr-8 border rounded-xl transition-colors",
          sector
            ? sector.border
            : item.type === "dir"
              ? "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
              : "border-zinc-800 bg-zinc-900 hover:border-red-500/30 hover:bg-zinc-800"
        )}
      >
        {item.type === "dir"
          ? <FolderIcon size={18} className={clsx("shrink-0", sector?.iconColor ?? "text-amber-400")} />
          : <FileText size={18} className="text-zinc-600 shrink-0" />}
        <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-100 truncate transition-colors">
          {item.name.replace(/\.md$/, "")}
        </span>
      </Link>
    </div>
  );
}

// ── "Move to parent" drop zone ───────────────────────────────────────

function ParentZone({ show }: { show: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "__parent__" });
  if (!show) return null;
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex items-center gap-2 px-4 py-3 mb-4 rounded-xl border border-dashed text-sm transition-colors",
        isOver ? "border-red-500 bg-red-500/10 text-red-400" : "border-zinc-700 text-zinc-600"
      )}
    >
      <ArrowUp size={14} /> Drop here to move to parent folder
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────

interface Props {
  items: FileItem[];
  currentPath?: string;
  onRefresh: () => void;
}

export default function ContentGrid({ items, currentPath = "", onRefresh }: Props) {
  const [activeItem, setActiveItem] = useState<FileItem | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 250, tolerance: 8 } })
  );

  // Parent path for the "move up" zone
  const parentPath = currentPath
    ? currentPath.includes("/")
      ? currentPath.substring(0, currentPath.lastIndexOf("/"))
      : ""
    : null; // null = already at root

  function handleDragStart({ active }: DragStartEvent) {
    setActiveItem(items.find(i => i.path === active.id) ?? null);
    setMoveError("");
  }

  function handleDragOver({ over }: any) {
    setOverId(over?.id ?? null);
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveItem(null);
    setOverId(null);
    if (!over || active.id === over.id) return;

    const dragged = items.find(i => i.path === active.id);
    if (!dragged) return;

    let newParent: string;
    if (over.id === "__parent__") {
      newParent = parentPath ?? "";
    } else {
      const target = items.find(i => i.path === over.id);
      if (!target || target.type !== "dir") return;
      newParent = target.path;
    }

    const newPath = newParent ? `${newParent}/${dragged.name}` : dragged.name;
    if (newPath === dragged.path) return;

    setMoving(true);
    try {
      const res = await fetch(
        `/api/files/${dragged.path.split("/").map(encodeURIComponent).join("/")}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPath }),
        }
      );
      const data = await res.json();
      if (data.error) setMoveError(data.error);
      else onRefresh();
    } catch {
      setMoveError("Move failed");
    } finally {
      setMoving(false);
    }
  }

  return (
    <div className="relative">
      {moving && (
        <div className="absolute inset-0 bg-zinc-950/60 rounded-xl flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-300 text-sm shadow-xl">
            <Loader2 size={15} className="animate-spin text-red-400" /> Moving…
          </div>
        </div>
      )}

      {moveError && (
        <p className="text-red-400 text-sm mb-3">{moveError}</p>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <ParentZone show={!!activeItem && parentPath !== null} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(item => (
            <ItemCard
              key={item.path}
              item={item}
              isDropTarget={overId === item.path}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeItem && (
            <div className="flex items-center gap-3 p-4 border border-zinc-600 rounded-xl bg-zinc-800 shadow-2xl rotate-1 scale-105 opacity-95">
              {activeItem.type === "dir"
                ? <Folder size={18} className="text-amber-400 shrink-0" />
                : <FileText size={18} className="text-zinc-400 shrink-0" />}
              <span className="text-sm font-medium text-zinc-100">
                {activeItem.name.replace(/\.md$/, "")}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
