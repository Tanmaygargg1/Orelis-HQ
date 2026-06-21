"use client";
import Calendar from "@/components/Calendar";

export default function CalendarPage() {
  return (
    <div className="px-6 md:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Calendar</h1>
        <p className="text-zinc-500 text-sm mt-1">Click any day to add a meeting. Timeline milestones and tasks appear here too.</p>
      </div>
      <Calendar />
    </div>
  );
}
