"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { RefreshCw } from "lucide-react";
import ContentGrid from "@/components/ContentGrid";
import type { FileItem } from "@/lib/types";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function ContentPathPage() {
  const params = useParams();
  const pathParts = Array.isArray(params.path) ? params.path : [params.path as string];
  const subPath = pathParts.map(decodeURIComponent).join("/");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    setData(null);
    fetch(`/api/files/${pathParts.map(encodeURIComponent).join("/")}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [subPath]);

  useEffect(() => { load(); }, [load]);

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
      <div className="px-6 md:px-8 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-zinc-100">{subPath.split("/").pop()}</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Drag the <span className="text-zinc-400">⠿</span> handle to move files and folders.
          </p>
        </div>
        <ContentGrid items={files} currentPath={subPath} onRefresh={load} />
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
