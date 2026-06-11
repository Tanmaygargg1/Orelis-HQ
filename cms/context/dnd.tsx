"use client";
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { createContext, useContext, useState } from "react";
import { FileText, Folder, Loader2 } from "lucide-react";
import { broadcastRefresh } from "@/lib/refresh";

interface ActiveItem { name: string; itemType: "file" | "dir" }
interface DndState { moving: boolean }

const DndStateCtx = createContext<DndState>({ moving: false });
export const useSharedDnd = () => useContext(DndStateCtx);

export default function DndProvider({ children }: { children: React.ReactNode }) {
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);
  const [moving, setMoving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveItem({
      name: active.data.current?.name ?? String(active.id).split("/").pop() ?? "",
      itemType: active.data.current?.itemType ?? "file",
    });
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveItem(null);
    if (!over || active.id === over.id) return;

    const fromPath = String(active.id);
    const draggedName = fromPath.split("/").pop()!;

    let newParent: string;
    if (over.id === "__parent__") {
      newParent = String(over.data.current?.parentPath ?? "");
    } else {
      if (over.data.current?.itemType !== "dir") return;
      newParent = String(over.id);
    }

    // Prevent dropping a folder into itself or its own descendants
    if (newParent === fromPath || newParent.startsWith(fromPath + "/")) return;

    const newPath = newParent ? `${newParent}/${draggedName}` : draggedName;
    if (newPath === fromPath) return;

    setMoving(true);
    try {
      const res = await fetch(
        `/api/files/${fromPath.split("/").map(encodeURIComponent).join("/")}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPath }),
        },
      );
      const data = await res.json();
      if (!data.error) broadcastRefresh();
    } finally {
      setMoving(false);
    }
  }

  return (
    <DndStateCtx.Provider value={{ moving }}>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {children}

        <DragOverlay dropAnimation={null}>
          {activeItem && (
            <div className="flex items-center gap-2.5 px-3 py-2 border border-zinc-600 rounded-xl bg-zinc-800 shadow-2xl rotate-1 scale-105 opacity-95 pointer-events-none">
              {activeItem.itemType === "dir"
                ? <Folder size={15} className="text-amber-400 shrink-0" />
                : <FileText size={15} className="text-zinc-400 shrink-0" />}
              <span className="text-sm font-medium text-zinc-100 whitespace-nowrap">
                {activeItem.name.replace(/\.md$/, "")}
              </span>
            </div>
          )}
        </DragOverlay>

        {moving && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-300 text-sm shadow-2xl">
            <Loader2 size={14} className="animate-spin text-red-400" /> Moving…
          </div>
        )}
      </DndContext>
    </DndStateCtx.Provider>
  );
}
