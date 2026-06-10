import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTasks, saveTasks } from "@/lib/github";
import type { Task } from "@/lib/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const data = await getTasks();
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
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveTasks([...tasks, newTask], sha);
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
    const updated = tasks.map((t) =>
      t.id === task.id ? { ...task, updatedAt: new Date().toISOString() } : t
    );
    await saveTasks(updated, sha);
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
    await saveTasks(tasks.filter((t) => t.id !== id), sha);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
