"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2, Megaphone, BarChart3, Layers, Users, Lightbulb,
  FileText, Folder, RefreshCw, ChevronRight,
} from "lucide-react";
import type { FileItem } from "@/lib/types";

// Sector definitions — maps folder names to icons, colors, descriptions
const SECTORS: Record<string, {
  icon: React.ElementType;
  border: string;
  bg: string;
  iconColor: string;
  description: string;
}> = {
  "Business Information": {
    icon: Building2,
    border: "border-red-500/30 hover:border-red-500/60",
    bg: "bg-red-500/5",
    iconColor: "text-red-400",
    description: "Company overview, strategy, and business model",
  },
  "Marketing": {
    icon: Megaphone,
    border: "border-amber-500/30 hover:border-amber-500/60",
    bg: "bg-amber-500/5",
    iconColor: "text-amber-400",
    description: "Brand, campaigns, content strategy, and market analysis",
  },
  "Finance": {
    icon: BarChart3,
    border: "border-emerald-500/30 hover:border-emerald-500/60",
    bg: "bg-emerald-500/5",
    iconColor: "text-emerald-400",
    description: "Financial tracking, budgets, and projections",
  },
  "Product": {
    icon: Layers,
    border: "border-blue-500/30 hover:border-blue-500/60",
    bg: "bg-blue-500/5",
    iconColor: "text-blue-400",
    description: "Features, UI design, and product roadmap",
  },
  "Team": {
    icon: Users,
    border: "border-purple-500/30 hover:border-purple-500/60",
    bg: "bg-purple-500/5",
    iconColor: "text-purple-400",
    description: "Handovers, guides, and team processes",
  },
  "Ideas": {
    icon: Lightbulb,
    border: "border-zinc-500/30 hover:border-zinc-500/60",
    bg: "bg-zinc-500/5",
    iconColor: "text-zinc-400",
    description: "Research, experiments, and brainstorming",
  },
};

function SectorCard({ item, fileCount }: { item: FileItem; fileCount?: number }) {
  const meta = SECTORS[item.name];
  const Icon = meta?.icon ?? Folder;

  return (
    <Link
      href={`/content/${item.path}`}
      className={`flex flex-col p-5 border rounded-2xl transition-all group ${
        meta
          ? `${meta.border} ${meta.bg}`
          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl bg-zinc-900/80 ${meta ? "" : "bg-zinc-800"}`}>
          <Icon size={20} className={meta?.iconColor ?? "text-zinc-400"} />
        </div>
        <ChevronRight size={16} className="text-zinc-700 group-hover:text-zinc-400 transition-colors mt-0.5" />
      </div>
      <h3 className="font-semibold text-zinc-100 text-base mb-1">{item.name}</h3>
      {meta?.description && (
        <p className="text-xs text-zinc-500 leading-relaxed mb-3">{meta.description}</p>
      )}
      {fileCount !== undefined && (
        <p className="text-xs text-zinc-600 mt-auto">{fileCount} {fileCount === 1 ? "item" : "items"}</p>
      )}
    </Link>
  );
}

export default function ContentPage() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/files")
      .then(r => r.json())
      .then(async d => {
        if (!d.files) return;
        setItems(d.files);
        // Fetch file counts for each directory
        const counts: Record<string, number> = {};
        await Promise.all(
          d.files
            .filter((f: FileItem) => f.type === "dir")
            .map(async (f: FileItem) => {
              try {
                const res = await fetch(`/api/files/${f.path.split("/").map(encodeURIComponent).join("/")}`);
                const data = await res.json();
                counts[f.path] = data.files?.length ?? 0;
              } catch { counts[f.path] = 0; }
            })
        );
        setFileCounts(counts);
      })
      .finally(() => setLoading(false));
  }, []);

  const sectors = items.filter(i => i.type === "dir");
  // Sort sectors: known sectors first in defined order, then alphabetical
  const sectorOrder = Object.keys(SECTORS);
  const sortedSectors = [...sectors].sort((a, b) => {
    const ai = sectorOrder.indexOf(a.name);
    const bi = sectorOrder.indexOf(b.name);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  const files = items.filter(i => i.type === "file");

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-600 text-sm px-8 py-8">
        <RefreshCw size={14} className="animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="px-6 md:px-8 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-zinc-600 uppercase tracking-widest mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-zinc-100">Orelis HQ</h1>
        <p className="text-zinc-500 text-sm mt-1">Your team's knowledge base. Click a section to explore.</p>
      </div>

      {/* Sectors grid */}
      {sortedSectors.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-4">Sections</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSectors.map(item => (
              <SectorCard key={item.path} item={item} fileCount={fileCounts[item.path]} />
            ))}
          </div>
        </div>
      )}

      {/* Loose root files */}
      {files.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-3">Files</h2>
          <div className="space-y-1">
            {files.map(item => (
              <Link
                key={item.path}
                href={`/content/${item.path}`}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800 transition-all group"
              >
                <FileText size={15} className="text-zinc-600 shrink-0" />
                <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  {item.name.replace(/\.md$/, "")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
