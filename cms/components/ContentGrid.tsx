"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Folder, FileText, MoreHorizontal, Building2, Megaphone,
  BarChart3, Layers, Users, Lightbulb, Pencil, Trash2,
  FilePlus, FolderPlus, FolderInput, ArrowUp, Loader2, GripVertical,
} from "lucide-react";
import clsx from "clsx";
import type { FileItem } from "@/lib/types";
import { broadcastRefresh } from "@/lib/refresh";
import DeleteModal from "@/components/DeleteModal";
import NewItemModal from "@/components/NewItemModal";
import MoveToModal from "@/components/MoveToModal";

const SECTOR: Record<string, { border: string; icon: React.ElementType; iconColor: string }> = {
  "Business Information": { border: "border-red-500/30 bg-red-500/5 hover:border-red-500/50",            icon: Building2, iconColor: "text-red-400"     },
  "Marketing":            { border: "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50",      icon: Megaphone, iconColor: "text-amber-400"   },
  "Finance":              { border: "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50",icon: BarChart3, iconColor: "text-emerald-400" },
  "Product":              { border: "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50",         icon: Layers,    iconColor: "text-blue-400"    },
  "Team":                 { border: "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50",   icon: Users,     iconColor: "text-purple-400"  },
  "Ideas":                { border: "border-zinc-500/30 bg-zinc-500/5 hover:border-zinc-500/50",         icon: Lightbulb, iconColor: "text-zinc-400"    },
};

// ── Shared move helper (exported so Sidebar can reuse) ────────────────────────
export async function moveItem(fromPath: string, toParentPath: string): Promise<string | null> {
  const name = fromPath.split("/").pop()!;
  if (toParentPath === fromPath || toParentPath.startsWith(fromPath + "/"))
    return "Cannot move a folder into itself";
  const newPath = toParentPath ? `${toParentPath}/${name}` : name;
  if (newPath === fromPath) return null;
  const res = await fetch(
    `/api/files/${fromPath.split("/").map(encodeURIComponent).join("/")}`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPath }) },
  );
  const data = await res.json();
  if (data.error) return data.error;
  broadcastRefresh();
  return null;
}

// ── Item card ─────────────────────────────────────────────────────────────────
function ItemCard({
  item,
  onMoveStart,
  onMoveDone,
}: {
  item: FileItem;
  onMoveStart: () => void;
  onMoveDone: (err: string | null) => void;
}) {
  const router = useRouter();
  const [isDragging,    setIsDragging]    = useState(false);
  const [isDragOver,    setIsDragOver]    = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [renaming,      setRenaming]      = useState(false);
  const [renameVal,     setRenameVal]     = useState(item.name.replace(/\.md$/, ""));
  const [renameLoading, setRenameLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [newModal,      setNewModal]      = useState<"file" | "folder" | null>(null);
  const [moveToOpen,    setMoveToOpen]    = useState(false);
  const renameRef       = useRef<HTMLInputElement>(null);
  const menuRef         = useRef<HTMLDivElement>(null);
  const renameSubmitted = useRef(false);
  const dragEnterCount  = useRef(0);

  const sector     = item.type === "dir" ? SECTOR[item.name] : undefined;
  const FolderIcon = sector?.icon ?? Folder;

  useEffect(() => { if (renaming) renameRef.current?.focus(); }, [renaming]);
  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
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
    if (!newName || newName === item.name.replace(/\.md$/, "")) return;
    const ext    = item.type === "file" ? ".md" : "";
    const parent = item.path.includes("/") ? item.path.slice(0, item.path.lastIndexOf("/")) : "";
    const newPath = parent ? `${parent}/${newName}${ext}` : `${newName}${ext}`;
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

  // ── Drop target (folders only) ──
  function handleDragEnter(e: React.DragEvent) {
    if (item.type !== "dir") return;
    e.preventDefault();
    dragEnterCount.current++;
    setIsDragOver(true);
  }
  function handleDragOver(e: React.DragEvent) {
    if (item.type !== "dir") return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  }
  function handleDragLeave() {
    if (item.type !== "dir") return;
    dragEnterCount.current--;
    if (dragEnterCount.current <= 0) { dragEnterCount.current = 0; setIsDragOver(false); }
  }
  async function handleDrop(e: React.DragEvent) {
    if (item.type !== "dir") return;
    e.preventDefault();
    e.stopPropagation();
    dragEnterCount.current = 0;
    setIsDragOver(false);
    const fromPath = e.dataTransfer.getData("application/x-orelis");
    if (!fromPath) return;
    onMoveStart();
    const err = await moveItem(fromPath, item.path);
    onMoveDone(err);
  }

  return (
    <>
      {confirmDelete && (
        <DeleteModal name={item.name.replace(/\.md$/, "")} isFolder={item.type === "dir"}
          loading={deleteLoading} onConfirm={doDelete} onCancel={() => setConfirmDelete(false)} />
      )}
      {newModal   && <NewItemModal type={newModal} parentPath={item.path} onClose={() => setNewModal(null)} />}
      {moveToOpen && <MoveToModal item={item} onClose={() => setMoveToOpen(false)} />}

      <div
        className={clsx("relative group transition-opacity", isDragging && "opacity-30")}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drop highlight ring */}
        {isDragOver && (
          <div className="absolute inset-0 rounded-xl ring-2 ring-red-500 ring-offset-2 ring-offset-zinc-950 pointer-events-none z-10" />
        )}

        {/* Drag handle — ONLY this element is draggable */}
        <div
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.setData("application/x-orelis", item.path);
            e.dataTransfer.effectAllowed = "move";
            setIsDragging(true);
          }}
          onDragEnd={() => setIsDragging(false)}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1.5 text-zinc-500 hover:text-zinc-300 z-20"
          title="Drag to move"
        >
          <GripVertical size={14} />
        </div>

        {/* Three-dot menu */}
        <div ref={menuRef} className="absolute right-2 top-1/2 -translate-y-1/2 z-20">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700/50 rounded transition-all"
          >
            <MoreHorizontal size={13} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-30 py-1">
              <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); startRename(); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                <Pencil size={12} /> Rename
              </button>
              <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setMoveToOpen(true); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                <FolderInput size={12} /> Move to…
              </button>
              {item.type === "dir" && (<>
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setNewModal("file"); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                  <FilePlus size={12} /> New file here
                </button>
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setNewModal("folder"); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                  <FolderPlus size={12} /> New folder here
                </button>
              </>)}
              <div className="border-t border-zinc-800 my-1" />
              <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setConfirmDelete(true); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-zinc-800">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Card content — click navigates, double-click renames */}
        {renaming ? (
          <div className={clsx(
            "flex items-center gap-3 pl-8 pr-10 py-4 border rounded-xl",
            sector ? sector.border : "border-zinc-800 bg-zinc-900",
          )}>
            {item.type === "dir"
              ? <FolderIcon size={18} className={clsx("shrink-0", sector?.iconColor ?? "text-amber-400")} />
              : <FileText size={18} className="text-zinc-600 shrink-0" />}
            <input ref={renameRef} value={renameVal} onChange={e => setRenameVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); submitRename(); } if (e.key === "Escape") setRenaming(false); }}
              onBlur={submitRename} disabled={renameLoading}
              className="flex-1 bg-transparent text-sm font-medium text-zinc-200 outline-none border-b border-red-500 pb-0.5 min-w-0" />
          </div>
        ) : (
          <div
            onClick={() => router.push(`/content/${item.path}`)}
            onDoubleClick={(e) => { e.stopPropagation(); startRename(); }}
            className={clsx(
              "flex items-center gap-3 pl-8 pr-10 py-4 border rounded-xl transition-colors cursor-pointer select-none",
              sector ? sector.border
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
          </div>
        )}
      </div>
    </>
  );
}

// ── Ancestor drop zones ───────────────────────────────────────────────────────
function AncestorZone({ targetPath, label, onMove }: {
  targetPath: string; label: string; onMove: (from: string, to: string) => void;
}) {
  const [isOver, setIsOver] = useState(false);
  const count = useRef(0);
  return (
    <div
      onDragEnter={(e) => { e.preventDefault(); count.current++; setIsOver(true); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
      onDragLeave={() => { count.current--; if (count.current <= 0) { count.current = 0; setIsOver(false); } }}
      onDrop={(e) => {
        e.preventDefault(); count.current = 0; setIsOver(false);
        const from = e.dataTransfer.getData("application/x-orelis");
        if (from) onMove(from, targetPath);
      }}
      className={clsx(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed text-sm transition-all",
        isOver ? "border-red-500 bg-red-500/10 text-red-400 scale-[1.01]" : "border-zinc-700/60 text-zinc-600",
      )}
    >
      <ArrowUp size={13} />
      Move to <span className="font-medium ml-0.5">{label}</span>
    </div>
  );
}

function AncestorZones({ currentPath, onMove }: {
  currentPath: string; onMove: (from: string, to: string) => void;
}) {
  if (!currentPath) return null;
  const parts = currentPath.split("/");
  const zones: { targetPath: string; label: string }[] = [];
  for (let i = parts.length - 1; i >= 0; i--) {
    zones.push({ targetPath: parts.slice(0, i).join("/"), label: i === 0 ? "Root" : parts[i - 1] });
  }
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      {zones.map(z => <AncestorZone key={z.targetPath || "__root__"} {...z} onMove={onMove} />)}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props { items: FileItem[]; currentPath?: string }

export default function ContentGrid({ items, currentPath = "" }: Props) {
  const [moving,    setMoving]    = useState(false);
  const [moveError, setMoveError] = useState("");

  async function handleMove(fromPath: string, toParentPath: string) {
    setMoving(true);
    const err = await moveItem(fromPath, toParentPath);
    setMoving(false);
    if (err) { setMoveError(err); setTimeout(() => setMoveError(""), 4000); }
  }

  return (
    <div>
      {moving && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-300 text-sm shadow-2xl pointer-events-none">
          <Loader2 size={14} className="animate-spin text-red-400" /> Moving…
        </div>
      )}
      {moveError && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] bg-zinc-900 border border-red-500/50 rounded-lg px-4 py-2.5 text-red-400 text-sm shadow-2xl">
          {moveError}
        </div>
      )}
      <AncestorZones currentPath={currentPath} onMove={handleMove} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(item => (
          <ItemCard
            key={item.path}
            item={item}
            onMoveStart={() => setMoving(true)}
            onMoveDone={(err) => { setMoving(false); if (err) { setMoveError(err); setTimeout(() => setMoveError(""), 4000); } }}
          />
        ))}
      </div>
    </div>
  );
}
