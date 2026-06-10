"use client";
import { Menu } from "lucide-react";
import { useSidebar } from "@/context/sidebar";

export default function MobileHeader() {
  const { toggle } = useSidebar();
  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950 shrink-0">
      <button
        onClick={toggle}
        className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-red-700 rounded-md flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs">O</span>
        </div>
        <span className="text-white font-semibold text-sm tracking-tight">Orelis HQ</span>
      </div>
    </header>
  );
}
