"use client";

import { type Area, type Task, areaLastActivity, daysBetween } from "./types";

export function AreaSelector({
  areas,
  tasks,
  activeAreaId,
  onSelect,
  onManage,
}: {
  areas: Area[];
  tasks: Task[];
  activeAreaId: string | "all";
  onSelect: (id: string | "all") => void;
  onManage: () => void;
}) {
  const now = new Date();

  return (
    <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-1">
      <div className="flex gap-1.5">
        {areas.map((area) => {
          const lastActivity = areaLastActivity(area.id, tasks);
          const neglected = lastActivity
            ? daysBetween(lastActivity, now) >= area.neglect_threshold_days
            : false;
          const active = activeAreaId === area.id;
          return (
            <button
              key={area.id}
              onClick={() => onSelect(area.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active ? "bg-surface-2 text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: lastActivity ? area.color : "transparent",
                  border: lastActivity ? "none" : "1px solid currentColor",
                  opacity: lastActivity ? (neglected ? 0.4 : 1) : 0.4,
                }}
              />
              {area.name}
            </button>
          );
        })}
        <button
          onClick={() => onSelect("all")}
          className={`shrink-0 rounded-full px-3.5 py-2 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            activeAreaId === "all" ? "bg-surface-2 text-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          All
        </button>
      </div>
      <button
        onClick={onManage}
        className="shrink-0 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        Manage
      </button>
    </div>
  );
}
