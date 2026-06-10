"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Folder, FileText, RefreshCw } from "lucide-react";
import Editor from "@/components/Editor";
import type { FileItem } from "@/lib/types";

export default function ContentPathPage() {
  const params = useParams();
  const pathParts = Array.isArray(params.path) ? params.path : [params.path as string];
  const subPath = pathParts.map(decodeURIComponent).join("/");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/files/${pathParts.map(encodeURIComponent).join("/")}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [subPath]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-400 text-sm px-8 py-8">
        <RefreshCw size={14} className="animate-spin" /> Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-8 py-8">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  // Directory listing
  if (data?.type === "dir") {
    const files: FileItem[] = data.files || [];
    return (
      <div className="px-8 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-zinc-900">
            {subPath.split("/").pop()}
          </h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {files.filter((f) => !f.name.startsWith("_") && f.name !== ".gitkeep").map((item) => (
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
      </div>
    );
  }

  // File editor
  if (data?.type === "file") {
    return (
      <div className="h-full">
        <Editor
          filePath={subPath}
          initialContent={data.content}
          sha={data.sha}
          fileName={data.name}
        />
      </div>
    );
  }

  return null;
}
