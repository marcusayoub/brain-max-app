"use client";

import { todayLocal } from "@/lib/date";
import { type Area, type Task, areaLastActivity } from "./types";

const BAR_HEIGHT = 32;
const BAR_WIDTH = 7;
const BAR_GAP = 5;

function weekBuckets(): [string, string][] {
  // [start, end] local-date-key pairs, oldest to newest, 7 days each.
  const buckets: [string, string][] = [];
  for (let w = 3; w >= 0; w--) {
    buckets.push([todayLocal(-(w * 7 + 6)), todayLocal(-(w * 7))]);
  }
  return buckets;
}

function countInBucket(tasks: Task[], areaId: string, start: string, end: string) {
  return tasks.filter((t) => {
    if (t.area_id !== areaId || t.status !== "done" || !t.completed_at) return false;
    const d = t.completed_at.slice(0, 10);
    return d >= start && d <= end;
  }).length;
}

export function WeeklyRollup({
  areas,
  tasks,
  onBack,
}: {
  areas: Area[];
  tasks: Task[];
  onBack: () => void;
}) {
  const buckets = weekBuckets();

  const rows = areas
    .map((area) => ({
      area,
      counts: buckets.map(([start, end]) => countInBucket(tasks, area.id, start, end)),
      lastActivity: areaLastActivity(area.id, tasks),
    }))
    .sort((a, b) => (b.lastActivity?.getTime() ?? 0) - (a.lastActivity?.getTime() ?? 0));

  const globalMax = Math.max(1, ...rows.flatMap((r) => r.counts));
  const svgWidth = buckets.length * BAR_WIDTH + (buckets.length - 1) * BAR_GAP;

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        ← Tasks
      </button>

      <p className="mb-1 text-sm font-medium uppercase tracking-[0.08em] text-muted">
        Last 4 weeks
      </p>
      <h1 className="font-serif text-2xl italic text-foreground">Where your attention went</h1>

      <div className="mt-8 flex flex-col gap-6">
        {rows.map(({ area, counts }) => {
          const total = counts.reduce((s, c) => s + c, 0);
          return (
            <div key={area.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-foreground">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: area.color }}
                  />
                  {area.name}
                </p>
                <p className="mt-0.5 text-xs text-muted">{total} completed</p>
              </div>
              <svg
                width={svgWidth}
                height={BAR_HEIGHT}
                className="shrink-0"
                aria-label={`${area.name} weekly completions`}
              >
                {counts.map((count, i) => {
                  const h = Math.max(2, Math.round((count / globalMax) * BAR_HEIGHT));
                  return (
                    <rect
                      key={i}
                      x={i * (BAR_WIDTH + BAR_GAP)}
                      y={BAR_HEIGHT - h}
                      width={BAR_WIDTH}
                      height={h}
                      rx={1.5}
                      fill={area.color}
                      opacity={count === 0 ? 0.25 : 1}
                    />
                  );
                })}
              </svg>
            </div>
          );
        })}
        {rows.length === 0 && <p className="text-muted">No areas yet.</p>}
      </div>
    </div>
  );
}
