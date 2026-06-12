"use client";
import { useState, useEffect } from "react";
import { X, Folder, ChevronRight, Home, Loader2 } from "lucide-react";
import type { FileItem } from "@/lib/types";
import { broadcastRefresh } from "@/lib/refresh";

interface Props {
  item: FileItem;
  onClose: () => void;
}

export default function MoveToModal({ item, onClose }: Props) {
  const [browsePath, setBrowsePath] = useState("");
  const [folders, setFolders] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const url = browsePath
      ? `/api/files/${browsePath.split("/").map(encodeURIComponent).join("/")}`
      : "/api/files";
    fetch(url)
      .then(r => r.json())
      .then(d => {
        const all: FileItem[] = d.files ?? [];
        // Show only folders, excluding the item being moved (and its own path)
        setFolders(all.filter(f =>
          f.type === "dir" &&
          f.path !== item.path &&
          !item.path.startsWith(f.path + "/")
        ));
      })
      .finally(() => setLoading(false));
  }, [browsePath, item.path]);

  const breadcrumbs = browsePath ? browsePath.split("/") : [];

  async function doMove() {
    const newPath = browsePath ? `${browsePath}/${item.name}` : item.name;
    if (newPath === item.path) { onClose(); return; }
    setMoving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/files/${item.path.split("/").map(encodeURIComponent).join("/")}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPath }) },
      );
      const data = await res.json();
      if (data.error) { setError(data.error); setMoving(false); return; }
      broadcastRefresh();
      onClose();
    } catch {
      setError("Move failed");
      setMoving(false);
    }
  }

  const currentName = item.name.replace(/\.md$/, "");
  const targetLabel = browsePath ? browsePath.split("/").pop()! : "Root";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm flex flex-col max-h-[70vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <div>
            <h2 className="font-semibold text-zinc-100">Move &ldquo;{currentName}&rdquo;</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Choose a destination folder</p>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="px-5 pb-2 flex items-center gap-1 text-xs text-zinc-500 flex-wrap shrink-0">
          <button
            onClick={() => setBrowsePath("")}
            className={`flex items-center gap-0.5 hover:text-zinc-300 transition-colors ${!browsePath ? "text-zinc-300 font-medium" : ""}`}
          >
            <Home size={11} /> Root
          </button>
          {breadcrumbs.map((seg, i) => {
            const path = breadcrumbs.slice(0, i + 1).join("/");
            return (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight size={10} className="text-zinc-700" />
                <button
                  onClick={() => setBrowsePath(path)}
                  className={`hover:text-zinc-300 transition-colors ${i === breadcrumbs.length - 1 ? "text-zinc-300 font-medium" : ""}`}
                >
                  {seg}
                </button>
              </span>
            );
          })}
        </div>

        {/* Folder list */}
        <div className="flex-1 overflow-y-auto px-3 pb-2 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-zinc-600 text-sm gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : folders.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-8">No subfolders here</p>
          ) : (
            <div className="space-y-0.5">
              {folders.map(folder => (
                <button
                  key={folder.path}
                  onClick={() => setBrowsePath(folder.path)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors text-left"
                >
                  <Folder size={14} className="text-amber-400 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                  <ChevronRight size={12} className="text-zinc-600 ml-auto shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-800 shrink-0">
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              Cancel
            </button>
            <button
              onClick={doMove}
              disabled={moving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors"
            >
              {moving ? <><Loader2 size={13} className="animate-spin" /> Moving…</> : `Move to ${targetLabel}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
