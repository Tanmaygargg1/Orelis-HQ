"use client";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumb({ path }: { path: string }) {
  const parts = path.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-1 text-sm text-zinc-500 mb-2 flex-wrap">
      <Link href="/content" className="hover:text-zinc-300 transition-colors flex items-center">
        <Home size={12} />
      </Link>
      {parts.map((part, i) => {
        const href = "/content/" + parts.slice(0, i + 1).map(encodeURIComponent).join("/");
        return (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight size={12} className="text-zinc-700 shrink-0" />
            {i === parts.length - 1 ? (
              <span className="text-zinc-400">{part}</span>
            ) : (
              <Link href={href} className="hover:text-zinc-300 transition-colors">{part}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
