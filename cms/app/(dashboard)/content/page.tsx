"use client";
import { useEffect, useState, useCallback } from "react";
import { RefreshCw, FilePlus, FolderPlus } from "lucide-react";
import ContentGrid from "@/components/ContentGrid";
import NewItemModal from "@/components/NewItemModal";
import { useRefreshListener } from "@/lib/refresh";
import type { FileItem } from "@/lib/types";

export default function ContentPage() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"file" | "folder" | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/files")
      .then(r => r.json())
      .then(d => { if (d.files) setItems(d.files); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useRefreshListener(load);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="px-6 md:px-8 py-8 max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-600 uppercase tracking-widest mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-zinc-100">Orelis HQ</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Drag the <span className="text-zinc-400">⠿</span> handle to move · Double-click to rename · Right-click for more options
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setModal("file")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-600 hover:text-zinc-200 transition-colors"
          >
            <FilePlus size={13} /> New file
          </button>
          <button
            onClick={() => setModal("folder")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-600 hover:text-zinc-200 transition-colors"
          >
            <FolderPlus size={13} /> New folder
          </button>
        </div>
      </div>

      {modal && <NewItemModal type={modal} onClose={() => setModal(null)} />}

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-600 text-sm">
          <RefreshCw size={14} className="animate-spin" /> Loading…
        </div>
      ) : (
        <ContentGrid items={items} currentPath="" />
      )}
    </div>
  );
}
