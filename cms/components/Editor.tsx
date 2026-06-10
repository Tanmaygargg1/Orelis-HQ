"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Save, Eye, Edit2, Trash2, ChevronLeft } from "lucide-react";
import clsx from "clsx";

interface Props {
  filePath: string;
  initialContent: string;
  sha: string;
  fileName: string;
}

function renderWikilinks(content: string) {
  return content.replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
    return `<a class="wikilink" href="#">${title}</a>`;
  });
}

export default function Editor({ filePath, initialContent, sha, fileName }: Props) {
  const [content, setContent] = useState(initialContent);
  const [currentSha, setCurrentSha] = useState(sha);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  const dirty = content !== initialContent;

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/files/${encodeURIComponent(filePath)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, sha: currentSha }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) {
      setError(data.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // Re-fetch SHA after save
      const fileRes = await fetch(`/api/files/${encodeURIComponent(filePath)}`);
      const fileData = await fileRes.json();
      if (fileData.sha) setCurrentSha(fileData.sha);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/files/${encodeURIComponent(filePath)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sha: currentSha }),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
    } else {
      router.push("/content");
      router.refresh();
    }
  }

  // Ctrl/Cmd+S to save
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [content, currentSha]);

  const breadcrumbs = filePath.split("/");

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 bg-white shrink-0">
        <div className="flex items-center gap-2 text-sm text-zinc-400 min-w-0">
          <button
            onClick={() => router.back()}
            className="hover:text-zinc-700 transition-colors shrink-0"
          >
            <ChevronLeft size={16} />
          </button>
          {breadcrumbs.map((part, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span>/</span>}
              <span className={clsx(i === breadcrumbs.length - 1 ? "text-zinc-700 font-medium" : "")}>
                {part.replace(/\.md$/, "")}
              </span>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Edit / Preview toggle */}
          <div className="flex bg-zinc-100 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setMode("edit")}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors",
                mode === "edit" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              <Edit2 size={12} /> Edit
            </button>
            <button
              onClick={() => setMode("preview")}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors",
                mode === "preview" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              <Eye size={12} /> Preview
            </button>
          </div>

          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete file"
          >
            <Trash2 size={15} />
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors font-medium",
              saved
                ? "bg-green-50 text-green-700"
                : dirty
                ? "bg-indigo-600 text-white hover:bg-indigo-500"
                : "bg-zinc-100 text-zinc-400 cursor-default"
            )}
          >
            <Save size={14} />
            {saving ? "Saving…" : saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-6 py-2 bg-red-50 text-red-600 text-sm border-b border-red-100">
          {error}
        </div>
      )}

      {/* Editor / Preview */}
      <div className="flex-1 overflow-hidden">
        {mode === "edit" ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const start = e.currentTarget.selectionStart;
                const end = e.currentTarget.selectionEnd;
                const next = content.substring(0, start) + "  " + content.substring(end);
                setContent(next);
                requestAnimationFrame(() => {
                  e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                });
              }
            }}
            className="w-full h-full resize-none border-none outline-none px-8 py-6 font-mono text-sm text-zinc-800 leading-relaxed bg-white"
            placeholder="Start writing…"
          />
        ) : (
          <div className="px-8 py-6 overflow-y-auto h-full">
            <div
              className="prose-md max-w-3xl"
              dangerouslySetInnerHTML={{
                __html: renderWikilinks(
                  // We'll render via ReactMarkdown but need innerHTML for wikilinks
                  // So we do a two-step: markdown → HTML → wikilink substitution
                  // Simple approach: use a container div
                  ""
                ),
              }}
            />
            <div className="prose-md max-w-3xl">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content.replace(/\[\[([^\]]+)\]\]/g, (_, title) => `[${title}](#)`)}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-semibold text-zinc-900 mb-2">Delete file?</h2>
            <p className="text-zinc-500 text-sm mb-5">
              <span className="font-medium text-zinc-700">{fileName}</span> will be permanently deleted.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
