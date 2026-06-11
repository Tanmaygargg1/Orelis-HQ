"use client";

interface Props {
  name: string;
  isFolder?: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteModal({ name, isFolder, loading, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm p-5">
        <h3 className="font-semibold text-zinc-100 mb-2">Delete &ldquo;{name}&rdquo;?</h3>
        <p className="text-zinc-500 text-sm mb-5">
          {isFolder
            ? "This will permanently delete this folder and all files inside it."
            : "This will permanently delete this file."}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
