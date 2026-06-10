"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  FileText,
  CheckSquare,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FilePlus,
  FolderPlus,
  LogOut,
  File,
} from "lucide-react";
import clsx from "clsx";
import type { FileItem } from "@/lib/types";
import NewItemModal from "./NewItemModal";

function FileNode({
  item,
  depth = 0,
}: {
  item: FileItem;
  depth?: number;
}) {
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState<FileItem[]>([]);
  const pathname = usePathname();
  const href = `/content/${item.path}`;
  const active = pathname === href || pathname.startsWith(href + "/");

  async function toggle() {
    if (item.type !== "dir") return;
    if (!open && children.length === 0) {
      const res = await fetch(`/api/files/${encodeURIComponent(item.path)}`);
      const data = await res.json();
      if (data.files) setChildren(data.files);
    }
    setOpen((v) => !v);
  }

  const indent = depth * 12;

  if (item.type === "dir") {
    return (
      <div>
        <button
          onClick={toggle}
          style={{ paddingLeft: `${12 + indent}px` }}
          className={clsx(
            "flex items-center gap-1.5 w-full py-1 pr-3 text-sm rounded-md transition-colors",
            active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          )}
        >
          {open ? (
            <ChevronDown size={12} className="shrink-0 text-zinc-500" />
          ) : (
            <ChevronRight size={12} className="shrink-0 text-zinc-500" />
          )}
          {open ? (
            <FolderOpen size={14} className="shrink-0 text-indigo-400" />
          ) : (
            <Folder size={14} className="shrink-0 text-indigo-400" />
          )}
          <span className="truncate">{item.name}</span>
        </button>
        {open && children.length > 0 && (
          <div>
            {children.map((child) => (
              <FileNode key={child.path} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={href}
      style={{ paddingLeft: `${24 + indent}px` }}
      className={clsx(
        "flex items-center gap-1.5 w-full py-1 pr-3 text-sm rounded-md transition-colors",
        active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
      )}
    >
      <File size={13} className="shrink-0 text-zinc-500" />
      <span className="truncate">{item.name.replace(/\.md$/, "")}</span>
    </Link>
  );
}

export default function Sidebar() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [modal, setModal] = useState<"file" | "folder" | null>(null);
  const pathname = usePathname();

  async function loadRoot() {
    const res = await fetch("/api/files");
    const data = await res.json();
    if (data.files) setFiles(data.files);
  }

  useEffect(() => {
    loadRoot();
  }, []);

  const navItems = [
    { href: "/content", label: "Content", icon: FileText },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
  ];

  return (
    <>
      <aside className="w-60 bg-zinc-900 flex flex-col h-full shrink-0 border-r border-zinc-800">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="text-white font-semibold tracking-tight">Orelis HQ</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-2 pt-3 pb-2 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors",
                pathname.startsWith(href)
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-2 border-t border-zinc-800/50 mt-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Files</span>
            <div className="flex gap-1">
              <button
                onClick={() => setModal("file")}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
                title="New file"
              >
                <FilePlus size={13} />
              </button>
              <button
                onClick={() => setModal("folder")}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
                title="New folder"
              >
                <FolderPlus size={13} />
              </button>
            </div>
          </div>

          {/* File tree */}
          <div className="space-y-0.5">
            {files.map((item) => (
              <FileNode key={item.path} item={item} />
            ))}
          </div>
        </div>

        {/* Sign out */}
        <div className="mt-auto px-2 pb-4 border-t border-zinc-800 pt-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-md transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {modal && (
        <NewItemModal
          type={modal}
          onClose={() => setModal(null)}
          onCreated={() => {
            loadRoot();
            setModal(null);
          }}
        />
      )}
    </>
  );
}
