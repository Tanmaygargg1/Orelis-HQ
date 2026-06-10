"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { marked } from "marked";
import TurndownService from "turndown";
import {
  Bold, Italic, Underline as UIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks,
  Quote, Code, Minus,
  Save, Trash2, ChevronLeft, Check, Pencil, BookOpen, Home,
} from "lucide-react";
import clsx from "clsx";

// ── Markdown conversion ──────────────────────────────────────────────

const td = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// Preserve wikilinks through the HTML round-trip
td.addRule("wikilink", {
  filter: (node: any) => node.nodeName === "SPAN" && node.classList?.contains("wikilink"),
  replacement: (_: string, node: any) => node.textContent || "",
});

function mdToHtml(md: string): string {
  // Replace [[wikilinks]] with styled spans BEFORE markdown parsing
  const withChips = md.replace(
    /\[\[([^\]]+)\]\]/g,
    (_, title) => `<span class="wikilink">[[${title}]]</span>`
  );
  return marked.parse(withChips) as string;
}

function htmlToMd(html: string): string {
  return td.turndown(html);
}

// ── Toolbar ──────────────────────────────────────────────────────────

function Btn({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title?: string; children: React.ReactNode;
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={clsx(
        "p-1.5 rounded transition-colors",
        active ? "bg-red-600/20 text-red-400" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
      )}
    >
      {children}
    </button>
  );
}

function Sep() { return <div className="w-px h-4 bg-zinc-800 mx-0.5 shrink-0" />; }

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  if (!editor) return null;
  const e = editor;
  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-zinc-800 bg-zinc-900/60 flex-wrap shrink-0">
      <Btn onClick={() => e.chain().focus().toggleHeading({ level: 1 }).run()} active={e.isActive("heading", { level: 1 })} title="Heading 1"><Heading1 size={15} /></Btn>
      <Btn onClick={() => e.chain().focus().toggleHeading({ level: 2 }).run()} active={e.isActive("heading", { level: 2 })} title="Heading 2"><Heading2 size={15} /></Btn>
      <Btn onClick={() => e.chain().focus().toggleHeading({ level: 3 }).run()} active={e.isActive("heading", { level: 3 })} title="Heading 3"><Heading3 size={15} /></Btn>
      <Sep />
      <Btn onClick={() => e.chain().focus().toggleBold().run()} active={e.isActive("bold")} title="Bold (⌘B)"><Bold size={15} /></Btn>
      <Btn onClick={() => e.chain().focus().toggleItalic().run()} active={e.isActive("italic")} title="Italic (⌘I)"><Italic size={15} /></Btn>
      <Btn onClick={() => e.chain().focus().toggleUnderline().run()} active={e.isActive("underline")} title="Underline (⌘U)"><UIcon size={15} /></Btn>
      <Btn onClick={() => e.chain().focus().toggleStrike().run()} active={e.isActive("strike")} title="Strikethrough"><Strikethrough size={15} /></Btn>
      <Sep />
      <Btn onClick={() => e.chain().focus().toggleBulletList().run()} active={e.isActive("bulletList")} title="Bullet list"><List size={15} /></Btn>
      <Btn onClick={() => e.chain().focus().toggleOrderedList().run()} active={e.isActive("orderedList")} title="Numbered list"><ListOrdered size={15} /></Btn>
      <Btn onClick={() => e.chain().focus().toggleTaskList().run()} active={e.isActive("taskList")} title="Checklist"><ListChecks size={15} /></Btn>
      <Sep />
      <Btn onClick={() => e.chain().focus().toggleBlockquote().run()} active={e.isActive("blockquote")} title="Blockquote"><Quote size={15} /></Btn>
      <Btn onClick={() => e.chain().focus().toggleCodeBlock().run()} active={e.isActive("codeBlock")} title="Code block"><Code size={15} /></Btn>
      <Btn onClick={() => e.chain().focus().setHorizontalRule().run()} title="Divider"><Minus size={15} /></Btn>
    </div>
  );
}

// ── Editor ────────────────────────────────────────────────────────────

interface Props {
  filePath: string;
  initialContent: string;
  sha: string;
  fileName: string;
}

export default function Editor({ filePath, initialContent, sha, fileName }: Props) {
  const [currentSha, setCurrentSha] = useState(sha);
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    content: mdToHtml(initialContent),
    editable: false,
    editorProps: {
      handleDoubleClick() {
        if (mode === "read") setMode("edit");
        return false;
      },
    },
    onUpdate({ editor }) {
      setDirty(htmlToMd(editor.getHTML()).trim() !== initialContent.trim());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(mode === "edit");
    if (mode === "edit") setTimeout(() => editor.commands.focus("end"), 50);
  }, [editor, mode]);

  const apiPath = filePath.split("/").map(encodeURIComponent).join("/");

  const save = useCallback(async () => {
    if (!editor || !dirty) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/files/${apiPath}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: htmlToMd(editor.getHTML()), sha: currentSha }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) {
      setError(data.error);
    } else {
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 2500);
      const fresh = await fetch(`/api/files/${apiPath}`);
      const fd = await fresh.json();
      if (fd.sha) setCurrentSha(fd.sha);
    }
  }, [editor, dirty, currentSha, apiPath]);

  async function switchToRead() {
    if (dirty) await save();
    setMode("read");
  }

  async function handleDelete() {
    const res = await fetch(`/api/files/${apiPath}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sha: currentSha }),
    });
    const data = await res.json();
    if (data.error) setError(data.error);
    else { router.push("/content"); router.refresh(); }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); }
      if (e.key === "Escape" && mode === "edit") switchToRead();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [save, mode]);

  const crumbs = filePath.split("/");

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <a href="/content" className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors shrink-0">
            <Home size={12} /> Home
          </a>
          <button onClick={() => router.back()} className="text-zinc-600 hover:text-zinc-400 p-1 rounded transition-colors shrink-0">
            <ChevronLeft size={15} />
          </button>
          {crumbs.map((part, i) => (
            <span key={i} className="flex items-center gap-1.5 shrink-0 min-w-0">
              {i > 0 && <span className="text-zinc-700 text-sm">/</span>}
              <span className={clsx("truncate text-sm", i === crumbs.length - 1 ? "text-zinc-200 font-medium" : "text-zinc-600")}>
                {part.replace(/\.md$/, "")}
              </span>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {mode === "read" ? (
            <button onClick={() => setMode("edit")} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 rounded-lg transition-colors">
              <Pencil size={12} /> Edit
            </button>
          ) : (
            <>
              {saving && <span className="text-xs text-zinc-600">Saving…</span>}
              {saved && <span className="flex items-center gap-1 text-xs text-amber-400"><Check size={11} /> Saved</span>}
              {dirty && !saving && !saved && (
                <button onClick={save} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-medium">
                  <Save size={12} /> Save
                </button>
              )}
              <button onClick={switchToRead} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 rounded-lg transition-colors">
                <BookOpen size={12} /> Read
              </button>
            </>
          )}
          <button onClick={() => setConfirmDelete(true)} className="p-1.5 text-zinc-700 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {error && <div className="px-4 py-2 bg-red-500/10 text-red-400 text-sm border-b border-red-500/20 shrink-0">{error}</div>}

      {mode === "edit" && <Toolbar editor={editor ?? null} />}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto min-h-full">
          <EditorContent editor={editor} />
        </div>
      </div>

      {mode === "read" && (
        <div className="shrink-0 px-4 py-1.5 border-t border-zinc-900 text-center">
          <span className="text-xs text-zinc-700">Double-click to edit · Cmd+S to save · Esc to read</span>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-semibold text-zinc-100 mb-2">Delete file?</h2>
            <p className="text-zinc-500 text-sm mb-5"><span className="font-medium text-zinc-300">{fileName}</span> will be permanently deleted.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
