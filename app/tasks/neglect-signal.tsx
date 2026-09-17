"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayLocal } from "@/lib/date";
import { type Area, type Task, areaLastCompletion, daysBetween } from "./types";

const SUPPRESS_DAYS = 7;

export function NeglectSignal({
  userId,
  areas,
  tasks,
}: {
  userId: string | null;
  areas: Area[];
  tasks: Task[];
}) {
  const supabase = createClient();
  const [dismissedUntil, setDismissedUntil] = useState<Map<string, string>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!userId) return;
      const { data } = await supabase
        .from("area_signal_dismissals")
        .select("area_id, dismissed_until")
        .eq("user_id", userId);
      setDismissedUntil(
        new Map((data ?? []).map((d) => [d.area_id as string, d.dismissed_until as string])),
      );
      setLoaded(true);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!loaded) return null;

  const today = todayLocal();
  const now = new Date();

  const candidate = areas.find((area) => {
    if (resolvedId === area.id) return false;
    const until = dismissedUntil.get(area.id);
    if (until && until >= today) return false;

    const lastCompletion = areaLastCompletion(area.id, tasks);
    const baseline = lastCompletion ?? new Date(area.created_at);
    const daysSince = daysBetween(baseline, now);
    return daysSince >= area.neglect_threshold_days;
  });

  if (!candidate) return null;

  const lastCompletion = areaLastCompletion(candidate.id, tasks);
  const baseline = lastCompletion ?? new Date(candidate.created_at);
  const daysSince = daysBetween(baseline, now);

  async function dismiss() {
    const until = todayLocal(SUPPRESS_DAYS);
    await supabase
      .from("area_signal_dismissals")
      .upsert({ area_id: candidate!.id, user_id: userId, dismissed_until: until });
    setDismissedUntil((prev) => new Map(prev).set(candidate!.id, until));
    setResolvedId(candidate!.id);
  }

  return (
    <div className="mt-4 rounded-2xl bg-surface p-4">
      <p className="text-sm text-foreground">
        Nothing completed in {candidate.name} for {daysSince} days.
      </p>
      <button
        onClick={dismiss}
        className="mt-2 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        Dismiss
      </button>
    </div>
  );
}
