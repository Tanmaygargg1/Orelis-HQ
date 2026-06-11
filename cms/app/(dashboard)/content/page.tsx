"use client";
import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import ContentGrid from "@/components/ContentGrid";
import type { FileItem } from "@/lib/types";

export default function ContentPage() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/files")
      .then(r => r.json())
      .then(d => { if (d.files) setItems(d.files); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="px-6 md:px-8 py-8 max-w-5xl">
      <div className="mb-8">
        <p className="text-xs text-zinc-600 uppercase tracking-widest mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-zinc-100">Orelis HQ</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Drag the <span className="text-zinc-400">⠿</span> handle on any card to move it into a folder.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-600 text-sm">
          <RefreshCw size={14} className="animate-spin" /> Loading…
        </div>
      ) : (
        <ContentGrid items={items} currentPath="" onRefresh={load} />
      )}
    </div>
  );
}
