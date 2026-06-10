"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  FileText, CheckSquare, ChevronRight, ChevronDown,
  Folder, FolderOpen, FilePlus, FolderPlus, LogOut, File, X,
} from "lucide-react";
import clsx from "clsx";
import type { FileItem } from "@/lib/types";
import NewItemModal from "./NewItemModal";
import { useSidebar } from "@/context/sidebar";

function FileNode({ item, depth = 0, onNavigate }: { item: FileItem; depth?: number; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState<FileItem[]>([]);
  const pathname = usePathname();
  const href = `/content/${item.path}`;
  const active = pathname === href || pathname.startsWith(href + "/");
  const indent = depth * 12;

  async function toggle() {
    if (item.type !== "dir") return;
    if (!open && children.length === 0) {
      const res = await fetch(`/api/files/${item.path.split("/").map(encodeURIComponent).join("/")}`);
      const data = await res.json();
      if (data.files) setChildren(data.files);
    }
    setOpen(v => !v);
  }

  if (item.type === "dir") {
    return (
      <div>
        <button
          onClick={toggle}
          style={{ paddingLeft: `${12 + indent}px` }}
          className={clsx(
            "flex items-center gap-1.5 w-full py-1 pr-3 text-sm rounded-md transition-colors",
            active ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
          )}
        >
          {open ? <ChevronDown size={12} className="shrink-0 text-zinc-600" /> : <ChevronRight size={12} className="shrink-0 text-zinc-600" />}
          {open ? <FolderOpen size={14} className="shrink-0 text-amber-400" /> : <Folder size={14} className="shrink-0 text-amber-400" />}
          <span className="truncate">{item.name}</span>
        </button>
        {open && children.length > 0 && (
          <div>{children.map(child => <FileNode key={child.path} item={child} depth={depth + 1} onNavigate={onNavigate} />)}</div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      style={{ paddingLeft: `${24 + indent}px` }}
      className={clsx(
        "flex items-center gap-1.5 w-full py-1 pr-3 text-sm rounded-md transition-colors",
        active ? "bg-zinc-800 text-zinc-100 border-l-2 border-red-500" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
      )}
    >
      <File size={13} className="shrink-0 text-zinc-600" />
      <span className="truncate">{item.name.replace(/\.md$/, "")}</span>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [modal, setModal] = useState<"file" | "folder" | null>(null);
  const pathname = usePathname();

  async function loadRoot() {
    const res = await fetch("/api/files");
    const data = await res.json();
    if (data.files) setFiles(data.files);
  }

  useEffect(() => { loadRoot(); }, []);

  const navItems = [
    { href: "/content", label: "Content", icon: FileText },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
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
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={clsx(
              "flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors",
              pathname.startsWith(href) ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
            )}
          >
            <Icon size={15} className={pathname.startsWith(href) ? "text-red-400" : ""} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-2 border-t border-zinc-800/50 flex-1 overflow-y-auto min-h-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-600 uppercase tracking-wider">Files</span>
          <div className="flex gap-0.5">
            <button onClick={() => setModal("file")} className="p-1 text-zinc-600 hover:text-zinc-400 rounded transition-colors" title="New file">
              <FilePlus size={13} />
            </button>
            <button onClick={() => setModal("folder")} className="p-1 text-zinc-600 hover:text-zinc-400 rounded transition-colors" title="New folder">
              <FolderPlus size={13} />
            </button>
          </div>
        </div>
        <div className="space-y-0.5">
          {files.map(item => <FileNode key={item.path} item={item} onNavigate={onNavigate} />)}
        </div>
      </div>

      <div className="px-2 pb-4 border-t border-zinc-800 pt-3 shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/40 rounded-md transition-colors"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>

      {modal && (
        <NewItemModal type={modal} onClose={() => setModal(null)} onCreated={() => { loadRoot(); setModal(null); }} />
      )}
    </>
  );
}

export default function Sidebar() {
  const { open, close } = useSidebar();

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden md:flex w-60 bg-zinc-900 flex-col h-full shrink-0 border-r border-zinc-800">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar — overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={close} />
          {/* Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-zinc-900 flex flex-col h-full border-r border-zinc-800 z-10">
            <button
              onClick={close}
              className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
            <SidebarContent onNavigate={close} />
          </aside>
        </div>
      )}
    </>
  );
}
