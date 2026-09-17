"use client";

import { useState } from "react";
import { todayLocal } from "@/lib/date";

export type LogRow = {
  habit_id: string | null;
  habit_title: string;
  date: string;
  completed: boolean;
};

const GRID_DAYS = 35;

function fillClass(completed: number, total: number) {
  if (total === 0) return "border border-foreground/10";
  if (completed === total) return "bg-accent";
  const ratio = completed / total;
  if (ratio >= 0.5) return "bg-accent/50";
  return "bg-accent/20";
}

export function MonthGrid({ logs }: { logs: LogRow[] }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = Array.from({ length: GRID_DAYS }, (_, i) =>
    todayLocal(-(GRID_DAYS - 1 - i)),
  );

  const byDate = new Map<string, LogRow[]>();
  for (const log of logs) {
    const list = byDate.get(log.date) ?? [];
    list.push(log);
    byDate.set(log.date, list);
  }

  const today = todayLocal();
  const selectedLogs = selectedDate ? (byDate.get(selectedDate) ?? []) : [];

  return (
    <div className="mt-6">
      <p className="mb-2 text-xs uppercase tracking-[0.08em] text-muted">
        Last {GRID_DAYS} days
      </p>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((date) => {
          const dayLogs = byDate.get(date) ?? [];
          const total = dayLogs.length;
          const completed = dayLogs.filter((l) => l.completed).length;
          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              aria-label={date}
              className={`aspect-square rounded-md transition-[transform] duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${fillClass(completed, total)} ${
                date === today ? "ring-1 ring-foreground/30" : ""
              }`}
            />
          );
        })}
      </div>

      {selectedDate && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-6 animate-[dialog-in_150ms_var(--ease-spring)]"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-semibold text-foreground">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            {selectedLogs.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No record for this day.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-1.5">
                {selectedLogs.map((log, i) => (
                  <li
                    key={`${log.habit_id ?? "deleted"}-${i}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        log.completed ? "bg-accent" : "bg-foreground/20"
                      }`}
                    />
                    <span className={log.completed ? "text-foreground" : "text-muted"}>
                      {log.habit_title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setSelectedDate(null)}
              className="mt-6 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
