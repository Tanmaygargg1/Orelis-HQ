"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Folder, FileText, RefreshCw } from "lucide-react";
import type { FileItem } from "@/lib/types";

export default function ContentPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/files")
      .then((r) => r.json())
      .then((d) => { if (d.files) setFiles(d.files); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Content</h1>
        <p className="text-zinc-500 text-sm mt-1">All your notes, docs, and ideas in one place.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <RefreshCw size={14} className="animate-spin" /> Loading…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {files.filter((f) => !f.name.startsWith("_")).map((item) => (
            <Link
              key={item.path}
              href={`/content/${item.path}`}
              className="flex items-center gap-3 p-4 border border-zinc-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
            >
              {item.type === "dir" ? (
                <Folder size={18} className="text-indigo-400 shrink-0" />
              ) : (
                <FileText size={18} className="text-zinc-400 shrink-0" />
              )}
              <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900 truncate">
                {item.name.replace(/\.md$/, "")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
