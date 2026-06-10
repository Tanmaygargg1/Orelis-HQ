"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Folder, FileText, RefreshCw } from "lucide-react";
import type { FileItem } from "@/lib/types";

// ssr:false prevents TipTap SSR hydration mismatch
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

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
    setData(null);
    fetch(`/api/files/${pathParts.map(encodeURIComponent).join("/")}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [subPath]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-600 text-sm px-8 py-8">
        <RefreshCw size={14} className="animate-spin" /> Loading…
      </div>
    );
  }

  if (error) return <div className="px-8 py-8 text-red-400 text-sm">{error}</div>;

  if (data?.type === "dir") {
    const files: FileItem[] = (data.files || []).filter((f: FileItem) => f.name !== ".gitkeep");
    return (
      <div className="px-8 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-zinc-100">{subPath.split("/").pop()}</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {files.map((item) => (
            <Link
              key={item.path}
              href={`/content/${item.path}`}
              className="flex items-center gap-3 p-4 border border-zinc-800 rounded-xl bg-zinc-900 hover:border-red-500/40 hover:bg-zinc-800 transition-all group"
            >
              {item.type === "dir"
                ? <Folder size={18} className="text-amber-400 shrink-0" />
                : <FileText size={18} className="text-zinc-600 shrink-0" />}
              <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-100 truncate transition-colors">
                {item.name.replace(/\.md$/, "")}
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (data?.type === "file") {
    return (
      <div className="h-full">
        <Editor filePath={subPath} initialContent={data.content} sha={data.sha} fileName={data.name} />
      </div>
    );
  }

  return null;
}
