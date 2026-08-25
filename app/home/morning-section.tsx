"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

type Goal = { id: string; statement: string };

function todayLocal() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function MorningSection({
  userId,
  goals,
}: {
  userId: string;
  goals: Goal[];
}) {
  const supabase = createClient();
  const today = todayLocal();

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [intention, setIntention] = useState("");
  const [goalId, setGoalId] = useState("");
  const [saved, setSaved] = useState<{
    intention: string;
    goalId: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("diary_entries")
        .select("morning_intention, morning_goal_id")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();

      if (data?.morning_intention) {
        setSaved({
          intention: data.morning_intention,
          goalId: data.morning_goal_id ?? "",
        });
      } else {
        setEditing(true);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!intention.trim()) return;

    await supabase.from("diary_entries").upsert(
      {
        user_id: userId,
        date: today,
        morning_intention: intention.trim(),
        morning_goal_id: goalId || null,
      },
      { onConflict: "user_id,date" },
    );

    setSaved({ intention: intention.trim(), goalId });
    setEditing(false);
  }

  const goalStatement = goals.find((g) => g.id === saved?.goalId)?.statement;

  if (loading) return null;

  return (
    <section>
      <p className="mb-3 text-sm font-medium uppercase tracking-[0.08em] text-muted">
        Morning
      </p>
      {editing ? (
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <Input
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="Today, I will..."
            autoFocus
          />
          {goals.length > 0 && (
            <Select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
              <option value="">No goal</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.statement}
                </option>
              ))}
            </Select>
          )}
          <Button type="submit" disabled={!intention.trim()} className="self-start">
            Set intention
          </Button>
        </form>
      ) : (
        <div>
          <p className="text-lg text-foreground">{saved?.intention}</p>
          {goalStatement && (
            <p className="font-display mt-1 italic text-accent">
              → {goalStatement}
            </p>
          )}
          <button
            onClick={() => {
              setIntention(saved?.intention ?? "");
              setGoalId(saved?.goalId ?? "");
              setEditing(true);
            }}
            className="mt-2 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            Edit
          </button>
        </div>
      )}
    </section>
  );
}
