"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  FileText, CheckSquare, ChevronRight, ChevronDown,
  Folder, FolderOpen, FilePlus, FolderPlus, LogOut, File, X,
  MoreHorizontal, Pencil, Trash2, FolderInput, CalendarDays, Video,
} from "lucide-react";
import clsx from "clsx";
import type { FileItem } from "@/lib/types";
import NewItemModal from "./NewItemModal";
import DeleteModal from "./DeleteModal";
import MoveToModal from "./MoveToModal";
import { useSidebar } from "@/context/sidebar";
import { broadcastRefresh, useRefreshListener } from "@/lib/refresh";

function FileNode({
  item,
  depth = 0,
  onNavigate,
}: {
  item: FileItem;
  depth?: number;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState<FileItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(item.name.replace(/\.md$/, ""));
  const [renameLoading, setRenameLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [newModal, setNewModal] = useState<"file" | "folder" | null>(null);
  const [moveToOpen, setMoveToOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);
  const renameSubmitted = useRef(false);

  const href = `/content/${item.path}`;
  const active = pathname === href || pathname.startsWith(href + "/");
  const indent = depth * 12;

  const fetchChildren = useCallback(async () => {
    const res = await fetch(`/api/files/${item.path.split("/").map(encodeURIComponent).join("/")}`);
    const data = await res.json();
    if (data.files) setChildren(data.files);
  }, [item.path]);

  useRefreshListener(useCallback(() => {
    if (open) fetchChildren();
  }, [open, fetchChildren]));

  async function toggle() {
    if (item.type !== "dir") return;
    if (!open && children.length === 0) await fetchChildren();
    setOpen(v => !v);
  }

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
    const ext = item.type === "file" ? ".md" : "";
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

  const rowCls = clsx(
    "flex items-center gap-1.5 w-full py-1 pr-8 text-sm rounded-md transition-colors relative group/row",
    active ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40",
  );

  const renameInput = (
    <div style={{ paddingLeft: `${item.type === "dir" ? 12 + indent : 24 + indent}px` }}
      className={clsx(rowCls, "pr-2")}>
      {item.type === "dir"
        ? <Folder size={14} className="shrink-0 text-amber-400" />
        : <File size={13} className="shrink-0 text-zinc-600" />}
      <input ref={renameRef} value={renameVal} onChange={e => setRenameVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); submitRename(); } if (e.key === "Escape") setRenaming(false); }}
        onBlur={submitRename} disabled={renameLoading}
        className="flex-1 bg-transparent text-sm text-zinc-200 outline-none border-b border-red-500 pb-px min-w-0" />
    </div>
  );

  const contextMenu = (
    <div ref={menuRef} className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 z-20 pr-0.5">
      <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setMenuOpen(v => !v); }}
        className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors">
        <MoreHorizontal size={11} />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 py-1">
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); startRename(); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
            <Pencil size={11} /> Rename
          </button>
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setMoveToOpen(true); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
            <FolderInput size={11} /> Move to…
          </button>
          {item.type === "dir" && (<>
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setNewModal("file"); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
              <FilePlus size={11} /> New file here
            </button>
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setNewModal("folder"); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
              <FolderPlus size={11} /> New folder here
            </button>
          </>)}
          <div className="border-t border-zinc-800 my-1" />
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setConfirmDelete(true); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-zinc-800">
            <Trash2 size={11} /> Delete
          </button>
        </div>
      )}
    </div>
  );

  if (item.type === "dir") {
    return (
      <div>
        {confirmDelete && <DeleteModal name={item.name} isFolder loading={deleteLoading} onConfirm={doDelete} onCancel={() => setConfirmDelete(false)} />}
        {newModal && <NewItemModal type={newModal} parentPath={item.path} onClose={() => setNewModal(null)} />}
        {moveToOpen && <MoveToModal item={item} onClose={() => setMoveToOpen(false)} />}
        <div className="relative">
          {renaming ? renameInput : (
            <button onClick={toggle} style={{ paddingLeft: `${12 + indent}px` }} className={rowCls}>
              {open ? <ChevronDown size={12} className="shrink-0 text-zinc-600" /> : <ChevronRight size={12} className="shrink-0 text-zinc-600" />}
              {open ? <FolderOpen size={14} className="shrink-0 text-amber-400" /> : <Folder size={14} className="shrink-0 text-amber-400" />}
              <span className="truncate">{item.name}</span>
            </button>
          )}
          {contextMenu}
        </div>
        {open && children.length > 0 && (
          <div>{children.map(child => <FileNode key={child.path} item={child} depth={depth + 1} onNavigate={onNavigate} />)}</div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {confirmDelete && <DeleteModal name={item.name.replace(/\.md$/, "")} loading={deleteLoading} onConfirm={doDelete} onCancel={() => setConfirmDelete(false)} />}
      {moveToOpen && <MoveToModal item={item} onClose={() => setMoveToOpen(false)} />}
      {renaming ? renameInput : (
        <Link href={href} onClick={onNavigate} style={{ paddingLeft: `${24 + indent}px` }}
          className={clsx(rowCls, active && "border-l-2 border-red-500")}>
          <File size={13} className="shrink-0 text-zinc-600" />
          <span className="truncate">{item.name.replace(/\.md$/, "")}</span>
        </Link>
      )}
      {contextMenu}
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [modal, setModal] = useState<"file" | "folder" | null>(null);
  const pathname = usePathname();

  const loadRoot = useCallback(async () => {
    const res = await fetch("/api/files");
    const data = await res.json();
    if (data.files) setFiles(data.files);
  }, []);

  useEffect(() => { loadRoot(); }, [loadRoot]);
  useRefreshListener(loadRoot);

  const navItems = [
    { href: "/content",  label: "Content",   icon: FileText     },
    { href: "/tasks",    label: "Tasks",      icon: CheckSquare  },
    { href: "/calendar", label: "Calendar",   icon: CalendarDays },
    { href: "/meetings", label: "Meetings",   icon: Video        },
  ];

  return (
    <>
      <div className="px-4 py-4 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-red-700 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="text-white font-semibold tracking-tight text-sm">Orelis HQ</span>
        </div>
      </div>

      <nav className="px-2 pt-3 pb-2 space-y-0.5 shrink-0">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={onNavigate}
            className={clsx(
              "flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors",
              pathname.startsWith(href) ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40",
            )}>
            <Icon size={15} className={pathname.startsWith(href) ? "text-red-400" : ""} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-2 border-t border-zinc-800/50 flex-1 overflow-y-auto min-h-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-600 uppercase tracking-wider">Files</span>
          <div className="flex gap-0.5">
            <button onClick={() => setModal("file")} title="New file"
              className="p-1 text-zinc-600 hover:text-zinc-400 rounded transition-colors">
              <FilePlus size={13} />
            </button>
            <button onClick={() => setModal("folder")} title="New folder"
              className="p-1 text-zinc-600 hover:text-zinc-400 rounded transition-colors">
              <FolderPlus size={13} />
            </button>
          </div>
        </div>
        <div className="space-y-0.5">
          {files.map(item => <FileNode key={item.path} item={item} onNavigate={onNavigate} />)}
        </div>
      </div>

      <div className="px-2 pb-4 border-t border-zinc-800 pt-3 shrink-0">
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/40 rounded-md transition-colors">
          <LogOut size={14} /> Sign out
        </button>
      </div>

      {modal && <NewItemModal type={modal} onClose={() => setModal(null)} />}
    </>
  );
}

export default function Sidebar() {
  const { open, close } = useSidebar();
  return (
    <>
      <aside className="hidden md:flex w-60 bg-zinc-900 flex-col h-full shrink-0 border-r border-zinc-800">
        <SidebarContent />
      </aside>
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={close} />
          <aside className="relative w-72 max-w-[85vw] bg-zinc-900 flex flex-col h-full border-r border-zinc-800 z-10">
            <button onClick={close} className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
              <X size={16} />
            </button>
            <SidebarContent onNavigate={close} />
          </aside>
        </div>
      )}
    </>
  );
}
