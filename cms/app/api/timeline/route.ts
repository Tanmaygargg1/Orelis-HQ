import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTimeline, saveTimeline } from "@/lib/github";
import { cacheGet, cacheSet, cacheInvalidate } from "@/lib/cache";
import type { TimelineItem } from "@/lib/types";

const KEY = "timeline:all";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cached = cacheGet(KEY);
  if (cached) return NextResponse.json(cached);

  try {
    const data = await getTimeline();
    cacheSet(KEY, data, 120_000);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { item, sha } = await req.json() as { item: Omit<TimelineItem, "id" | "createdAt" | "updatedAt">; sha?: string };
    const { items } = await getTimeline();
    const now = new Date().toISOString();
    const newItem: TimelineItem = { ...item, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    const sorted = [...items, newItem].sort((a, b) => a.date.localeCompare(b.date));
    await saveTimeline(sorted, sha);
    cacheInvalidate(KEY);
    return NextResponse.json({ item: newItem });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { item, sha } = await req.json() as { item: TimelineItem; sha?: string };
    const { items } = await getTimeline();
    const updated = items
      .map(i => i.id === item.id ? { ...item, updatedAt: new Date().toISOString() } : i)
      .sort((a, b) => a.date.localeCompare(b.date));
    await saveTimeline(updated, sha);
    cacheInvalidate(KEY);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, sha } = await req.json();
    const { items } = await getTimeline();
    await saveTimeline(items.filter(i => i.id !== id), sha);
    cacheInvalidate(KEY);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
