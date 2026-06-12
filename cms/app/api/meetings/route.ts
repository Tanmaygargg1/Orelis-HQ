import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMeetings, saveMeetings } from "@/lib/github";
import { cacheGet, cacheSet, cacheInvalidate } from "@/lib/cache";
import type { Meeting } from "@/lib/types";

const KEY = "meetings:all";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cached = cacheGet(KEY);
  if (cached) return NextResponse.json(cached);
  try {
    const data = await getMeetings();
    cacheSet(KEY, data, 15_000);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { meeting, sha } = await req.json() as { meeting: Omit<Meeting, "id" | "createdAt" | "updatedAt">; sha?: string };
    const { meetings } = await getMeetings();
    const newMeeting: Meeting = {
      ...meeting, id: crypto.randomUUID(),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await saveMeetings([...meetings, newMeeting], sha);
    cacheInvalidate(KEY);
    return NextResponse.json({ meeting: newMeeting });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { meeting, sha } = await req.json() as { meeting: Meeting; sha?: string };
    const { meetings } = await getMeetings();
    const updated = meetings.map(m => m.id === meeting.id ? { ...meeting, updatedAt: new Date().toISOString() } : m);
    await saveMeetings(updated, sha);
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
    const { meetings } = await getMeetings();
    await saveMeetings(meetings.filter(m => m.id !== id), sha);
    cacheInvalidate(KEY);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
