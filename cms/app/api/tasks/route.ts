import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTasks, saveTasks } from "@/lib/github";
import { cacheGet, cacheSet, cacheInvalidate } from "@/lib/cache";
import type { Task } from "@/lib/types";

const TASKS_KEY = "tasks:all";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cached = cacheGet(TASKS_KEY);
  if (cached) return NextResponse.json(cached);

  try {
    const data = await getTasks();
    cacheSet(TASKS_KEY, data, 120_000); // 2 min
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { task, sha } = await req.json() as { task: Omit<Task, "id" | "createdAt" | "updatedAt">; sha?: string };
    const { tasks } = await getTasks();
    const newTask: Task = {
      ...task, id: crypto.randomUUID(),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await saveTasks([...tasks, newTask], sha);
    cacheInvalidate(TASKS_KEY);
    return NextResponse.json({ task: newTask });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { task, sha } = await req.json() as { task: Task; sha?: string };
    const { tasks } = await getTasks();
    const updated = tasks.map(t => t.id === task.id ? { ...task, updatedAt: new Date().toISOString() } : t);
    await saveTasks(updated, sha);
    cacheInvalidate(TASKS_KEY);
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
    const { tasks } = await getTasks();
    await saveTasks(tasks.filter(t => t.id !== id), sha);
    cacheInvalidate(TASKS_KEY);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
