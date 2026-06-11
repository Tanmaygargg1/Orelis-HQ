"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { RefreshCw, FilePlus, FolderPlus } from "lucide-react";
import ContentGrid from "@/components/ContentGrid";
import Breadcrumb from "@/components/Breadcrumb";
import NewItemModal from "@/components/NewItemModal";
import { useRefreshListener } from "@/lib/refresh";
import type { FileItem } from "@/lib/types";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function ContentPathPage() {
  const params = useParams();
  const pathParts = Array.isArray(params.path) ? params.path : [params.path as string];
  const subPath = pathParts.map(decodeURIComponent).join("/");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"file" | "folder" | null>(null);

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
  useRefreshListener(load);

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
          <Breadcrumb path={subPath} />
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold text-zinc-100">{subPath.split("/").pop()}</h1>
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
        </div>
        {modal && <NewItemModal type={modal} parentPath={subPath} onClose={() => setModal(null)} />}
        <ContentGrid items={files} currentPath={subPath} />
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
