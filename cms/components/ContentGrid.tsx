"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  Folder, FileText, GripVertical, ArrowUp, MoreHorizontal,
  Building2, Megaphone, BarChart3, Layers, Users, Lightbulb,
  Pencil, Trash2, FilePlus, FolderPlus,
} from "lucide-react";
import clsx from "clsx";
import type { FileItem } from "@/lib/types";
import { broadcastRefresh } from "@/lib/refresh";
import DeleteModal from "@/components/DeleteModal";
import NewItemModal from "@/components/NewItemModal";

const SECTOR: Record<string, { border: string; icon: React.ElementType; iconColor: string }> = {
  "Business Information": { border: "border-red-500/30 bg-red-500/5 hover:border-red-500/50",       icon: Building2, iconColor: "text-red-400"     },
  "Marketing":            { border: "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50", icon: Megaphone, iconColor: "text-amber-400"   },
  "Finance":              { border: "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50", icon: BarChart3, iconColor: "text-emerald-400" },
  "Product":              { border: "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50",    icon: Layers,    iconColor: "text-blue-400"    },
  "Team":                 { border: "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50", icon: Users,  iconColor: "text-purple-400"  },
  "Ideas":                { border: "border-zinc-500/30 bg-zinc-500/5 hover:border-zinc-500/50",    icon: Lightbulb, iconColor: "text-zinc-400"    },
};

function ItemCard({ item }: { item: FileItem }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(item.name.replace(/\.md$/, ""));
  const [renameLoading, setRenameLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [newModal, setNewModal] = useState<"file" | "folder" | null>(null);
  const renameRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameSubmitted = useRef(false);

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: item.path,
    data: { name: item.name, itemType: item.type },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: item.path,
    data: { itemType: item.type },
    disabled: item.type !== "dir",
  });

  const setRef = (el: HTMLDivElement | null) => {
    setDragRef(el);
    if (item.type === "dir") setDropRef(el);
  };

  const sector = item.type === "dir" ? SECTOR[item.name] : undefined;
  const FolderIcon = sector?.icon ?? Folder;

  useEffect(() => { if (renaming) renameRef.current?.focus(); }, [renaming]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  function startRename() {
    renameSubmitted.current = false;
    setRenameVal(item.name.replace(/\.md$/, ""));
    setRenaming(true);
  }

  async function submitRename() {
    if (renameSubmitted.current) return;
    renameSubmitted.current = true;
    setRenaming(false);
    const newName = renameVal.trim();
    const currentName = item.name.replace(/\.md$/, "");
    if (!newName || newName === currentName) return;
    const ext = item.type === "file" ? ".md" : "";
    const parentPath = item.path.includes("/") ? item.path.slice(0, item.path.lastIndexOf("/")) : "";
    const newPath = parentPath ? `${parentPath}/${newName}${ext}` : `${newName}${ext}`;
    setRenameLoading(true);
    const res = await fetch(
      `/api/files/${item.path.split("/").map(encodeURIComponent).join("/")}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPath }) },
    );
    setRenameLoading(false);
    if (!(await res.json()).error) broadcastRefresh();
  }

  async function doDelete() {
    setDeleteLoading(true);
    const body = item.type === "file" ? JSON.stringify({ sha: item.sha }) : "{}";
    const res = await fetch(
      `/api/files/${item.path.split("/").map(encodeURIComponent).join("/")}`,
      { method: "DELETE", headers: { "Content-Type": "application/json" }, body },
    );
    setDeleteLoading(false);
    setConfirmDelete(false);
    if (!(await res.json()).error) broadcastRefresh();
  }

  return (
    <>
      {confirmDelete && (
        <DeleteModal
          name={item.name.replace(/\.md$/, "")}
          isFolder={item.type === "dir"}
          loading={deleteLoading}
          onConfirm={doDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {newModal && (
        <NewItemModal
          type={newModal}
          parentPath={item.path}
          onClose={() => setNewModal(null)}
        />
      )}

      <div
        ref={setRef}
        className={clsx("relative group", isDragging && "opacity-25 pointer-events-none")}
      >
        {/* Drop ring on hovered folder */}
        {isOver && item.type === "dir" && (
          <div className="absolute inset-0 rounded-xl ring-2 ring-red-500 ring-offset-2 ring-offset-zinc-950 pointer-events-none z-10" />
        )}

        {/* Three-dot menu */}
        <div ref={menuRef} className="absolute right-8 top-1/2 -translate-y-1/2 z-20">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(v => !v); }}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700/50 rounded transition-all"
          >
            <MoreHorizontal size={13} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-30 py-1">
              <button
                onClick={(e) => { e.preventDefault(); setMenuOpen(false); startRename(); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <Pencil size={12} /> Rename
              </button>
              {item.type === "dir" && (
                <>
                  <button
                    onClick={(e) => { e.preventDefault(); setMenuOpen(false); setNewModal("file"); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <FilePlus size={12} /> New file here
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); setMenuOpen(false); setNewModal("folder"); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <FolderPlus size={12} /> New folder here
                  </button>
                </>
              )}
              <div className="border-t border-zinc-800 my-1" />
              <button
                onClick={(e) => { e.preventDefault(); setMenuOpen(false); setConfirmDelete(true); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Drag handle */}
        <div
          {...listeners}
          {...attributes}
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1.5 text-zinc-600 hover:text-zinc-400 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </div>

        {renaming ? (
          <div className={clsx(
            "flex items-center gap-3 p-4 pr-8 border rounded-xl",
            sector ? sector.border : "border-zinc-800 bg-zinc-900",
          )}>
            {item.type === "dir"
              ? <FolderIcon size={18} className={clsx("shrink-0", sector?.iconColor ?? "text-amber-400")} />
              : <FileText size={18} className="text-zinc-600 shrink-0" />}
            <input
              ref={renameRef}
              value={renameVal}
              onChange={e => setRenameVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") { e.preventDefault(); submitRename(); }
                if (e.key === "Escape") { setRenaming(false); }
              }}
              onBlur={submitRename}
              disabled={renameLoading}
              className="flex-1 bg-transparent text-sm font-medium text-zinc-200 outline-none border-b border-red-500 pb-0.5 min-w-0"
            />
          </div>
        ) : (
          <Link
            href={`/content/${item.path}`}
            onDoubleClick={(e) => { e.preventDefault(); startRename(); }}
            className={clsx(
              "flex items-center gap-3 p-4 pr-8 border rounded-xl transition-colors",
              sector
                ? sector.border
                : item.type === "dir"
                  ? "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                  : "border-zinc-800 bg-zinc-900 hover:border-red-500/30 hover:bg-zinc-800",
            )}
          >
            {item.type === "dir"
              ? <FolderIcon size={18} className={clsx("shrink-0", sector?.iconColor ?? "text-amber-400")} />
              : <FileText size={18} className="text-zinc-600 shrink-0" />}
            <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-100 truncate transition-colors">
              {item.name.replace(/\.md$/, "")}
            </span>
          </Link>
        )}
      </div>
    </>
  );
}

function ParentZone({ show, parentPath }: { show: boolean; parentPath: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "__parent__",
    data: { parentPath, itemType: "dir" },
  });
  if (!show) return null;
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex items-center gap-2 px-4 py-3 mb-4 rounded-xl border border-dashed text-sm transition-colors",
        isOver ? "border-red-500 bg-red-500/10 text-red-400" : "border-zinc-700 text-zinc-600",
      )}
    >
      <ArrowUp size={14} /> Drop here to move to parent folder
    </div>
  );
}

interface Props {
  items: FileItem[];
  currentPath?: string;
}

export default function ContentGrid({ items, currentPath = "" }: Props) {
  const parentPath = currentPath
    ? currentPath.includes("/") ? currentPath.slice(0, currentPath.lastIndexOf("/")) : ""
    : null;

  return (
    <div className="relative">
      <ParentZone show={parentPath !== null} parentPath={parentPath ?? ""} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(item => (
          <ItemCard key={item.path} item={item} />
        ))}
      </div>
    </div>
  );
}
