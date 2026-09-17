"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayLocal, localDateKey } from "@/lib/date";

type Habit = { id: string; title: string; created_at: string };
type LogRow = { habit_id: string | null; date: string; completed: boolean };

const WINDOW_DAYS = 7;
const MISS_THRESHOLD = 3;
const SUPPRESS_DAYS = 7;

export function MissSignal({
  userId,
  habits,
  logs,
  onAdjust,
}: {
  userId: string | null;
  habits: Habit[];
  logs: LogRow[];
  onAdjust: (habitId: string) => void;
}) {
  const supabase = createClient();
  const [dismissedUntil, setDismissedUntil] = useState<Map<string, string>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!userId) return;
      const { data } = await supabase
        .from("habit_signal_dismissals")
        .select("habit_id, dismissed_until")
        .eq("user_id", userId);
      setDismissedUntil(
        new Map((data ?? []).map((d) => [d.habit_id as string, d.dismissed_until as string])),
      );
      setLoaded(true);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!loaded) return null;

  const today = todayLocal();
  const windowDates = Array.from({ length: WINDOW_DAYS }, (_, i) =>
    todayLocal(-(WINDOW_DAYS - i)),
  );

  const candidate = habits.find((habit) => {
    if (resolvedId === habit.id) return false;
    const until = dismissedUntil.get(habit.id);
    if (until && until >= today) return false;

    const createdDate = localDateKey(new Date(habit.created_at));
    let misses = 0;
    for (const d of windowDates) {
      if (d < createdDate) continue;
      const log = logs.find((l) => l.habit_id === habit.id && l.date === d);
      if (!log || !log.completed) misses++;
    }
    return misses >= MISS_THRESHOLD;
  });

  if (!candidate) return null;

  const createdDate = localDateKey(new Date(candidate.created_at));
  const missCount = windowDates.filter((d) => {
    if (d < createdDate) return false;
    const log = logs.find((l) => l.habit_id === candidate.id && l.date === d);
    return !log || !log.completed;
  }).length;

  async function respond(adjust: boolean) {
    const until = todayLocal(SUPPRESS_DAYS);
    await supabase
      .from("habit_signal_dismissals")
      .upsert({ habit_id: candidate!.id, user_id: userId, dismissed_until: until });
    setDismissedUntil((prev) => new Map(prev).set(candidate!.id, until));
    setResolvedId(candidate!.id);
    if (adjust) onAdjust(candidate!.id);
  }

  return (
    <div className="mt-6 rounded-2xl bg-surface p-4">
      <p className="text-sm text-foreground">
        {candidate.title} — missed {missCount} of the last {WINDOW_DAYS} days.
      </p>
      <div className="mt-3 flex gap-5 text-sm">
        <button
          onClick={() => respond(true)}
          className="text-accent transition-colors hover:text-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          Adjust it
        </button>
        <button
          onClick={() => respond(false)}
          className="text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          Keep it as is
        </button>
      </div>
    </div>
  );
}
