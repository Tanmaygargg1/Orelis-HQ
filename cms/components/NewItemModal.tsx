"use client";
import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  type: "file" | "folder";
  parentPath?: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function NewItemModal({ type, parentPath = "", onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const isFile = type === "file";
    const fileName = isFile && !name.endsWith(".md") ? `${name}.md` : name;
    const path = parentPath ? `${parentPath}/${fileName}` : fileName;

    if (isFile) {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content: `# ${name}\n\n` }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
    } else {
      // Create a placeholder .gitkeep in the folder so it exists
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: `${path}/.gitkeep`, content: "" }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
    }

    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-semibold text-zinc-900">
            New {type === "file" ? "file" : "folder"}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleCreate} className="px-5 pb-5 space-y-4">
          <div>
            <label className="block text-sm text-zinc-600 mb-1.5">Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "file" ? "my-note" : "My Folder"}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
            {type === "file" && (
              <p className="text-xs text-zinc-400 mt-1">.md will be added automatically</p>
            )}
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
