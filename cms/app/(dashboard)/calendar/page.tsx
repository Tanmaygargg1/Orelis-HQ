"use client";
import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import Calendar from "@/components/Calendar";
import { useRefreshListener } from "@/lib/refresh";
import type { Task, Meeting } from "@/lib/types";

export default function CalendarPage() {
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [tr, mr] = await Promise.all([
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/meetings").then(r => r.json()),
    ]);
    if (tr.tasks)    setTasks(tr.tasks);
    if (mr.meetings) setMeetings(mr.meetings);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useRefreshListener(load);

  return (
    <div className="px-6 md:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Calendar</h1>
        <p className="text-zinc-500 text-sm mt-1">Tasks and meetings across all time.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-600 text-sm">
          <RefreshCw size={14} className="animate-spin" /> Loading…
        </div>
      ) : (
        <Calendar tasks={tasks} meetings={meetings} />
      )}
    </div>
  );
}
