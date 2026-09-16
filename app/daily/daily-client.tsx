"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { PageShell } from "@/components/page-shell";
import { Toast } from "@/components/ui/toast";
import { todayLocal } from "@/lib/date";

type Goal = { id: string; statement: string };
type Habit = { id: string; title: string; goal_id: string | null };

export default function DailyClient() {
  const supabase = createClient();
  const today = todayLocal();

  const [userId, setUserId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkedToday, setCheckedToday] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState("");
  const [newGoalId, setNewGoalId] = useState("");
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [goalsRes, habitsRes, checkinsRes] = await Promise.all([
        supabase
          .from("goals")
          .select("id, statement")
          .eq("status", "active")
          .order("created_at", { ascending: true }),
        supabase
          .from("habits")
          .select("id, title, goal_id")
          .order("created_at", { ascending: true }),
        supabase.from("habit_checkins").select("habit_id").eq("date", today),
      ]);

      setGoals((goalsRes.data as Goal[]) ?? []);
      setHabits((habitsRes.data as Habit[]) ?? []);
      setCheckedToday(
        new Set((checkinsRes.data ?? []).map((c) => c.habit_id as string)),
      );
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleHabit(habitId: string) {
    if (!userId) return;
    const isChecked = checkedToday.has(habitId);

    if (isChecked) {
      const { error } = await supabase
        .from("habit_checkins")
        .delete()
        .eq("habit_id", habitId)
        .eq("date", today);
      if (error) {
        setToast(error.message);
        return;
      }
      setCheckedToday((prev) => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
    } else {
      const { error } = await supabase
        .from("habit_checkins")
        .insert({ habit_id: habitId, user_id: userId, date: today });
      if (error) {
        setToast(error.message);
        return;
      }
      setCheckedToday((prev) => new Set(prev).add(habitId));
    }
  }

  async function handleAddHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !userId) return;

    const { data, error } = await supabase
      .from("habits")
      .insert({
        user_id: userId,
        title: newTitle.trim(),
        goal_id: newGoalId || null,
      })
      .select()
      .single();

    if (error) {
      setToast(error.message);
      return;
    }
    setHabits((prev) => [...prev, data as Habit]);
    setNewTitle("");
    setNewGoalId("");
    setAdding(false);
  }

  async function handleDeleteHabit(habitId: string) {
    const { error } = await supabase.from("habits").delete().eq("id", habitId);
    if (error) {
      setToast(error.message);
      return;
    }
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    setCheckedToday((prev) => {
      const next = new Set(prev);
      next.delete(habitId);
      return next;
    });
  }

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl px-6 pt-8">
          <p className="text-muted">Loading...</p>
        </div>
      </PageShell>
    );
  }

  const now = new Date();
  const dayName = now.toLocaleDateString(undefined, { weekday: "long" });
  const dateLabel = now.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
  const goalById = new Map(goals.map((g) => [g.id, g.statement]));

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-6 pt-2">
        <p className="mb-1 text-sm font-medium uppercase tracking-[0.08em] text-muted">
          Today
        </p>
        <h1 className="text-4xl font-bold tracking-[-0.02em] text-foreground">
          {dayName}
        </h1>
        <p className="font-serif text-2xl italic text-muted">{dateLabel}</p>

        {habits.length > 0 && (
          <p className="mt-3 text-sm text-muted">
            {checkedToday.size} of {habits.length} today
          </p>
        )}

        <div className="mt-8 rounded-3xl bg-surface p-5">
          {habits.length === 0 && (
            <p className="text-muted">
              Nothing here yet — add a habit below, something you want to do
              every day.
            </p>
          )}
          <ul className="flex flex-col gap-1">
            {habits.map((habit) => {
              const checked = checkedToday.has(habit.id);
              const goalLabel = habit.goal_id
                ? goalById.get(habit.goal_id)
                : null;
              return (
                <li key={habit.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => toggleHabit(habit.id)}
                    className="flex flex-1 items-center gap-3 rounded-xl py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors duration-150 ${
                        checked
                          ? "border-accent bg-accent"
                          : "border-foreground/25"
                      }`}
                    >
                      {checked && (
                        <svg viewBox="0 0 12 12" className="h-3.5 w-3.5 text-black" fill="none">
                          <path
                            d="M2.5 6.5L4.75 8.5L9.5 3.5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1">
                      <span
                        className={
                          checked
                            ? "text-muted line-through decoration-muted/50"
                            : "text-foreground"
                        }
                      >
                        {habit.title}
                      </span>
                      {goalLabel && (
                        <span className="block text-xs text-muted">
                          {goalLabel}
                        </span>
                      )}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    aria-label="Delete habit"
                    className="shrink-0 rounded p-1.5 text-muted opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent group-hover:opacity-100"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>

          {adding ? (
            <form onSubmit={handleAddHabit} className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="New habit"
                autoFocus
              />
              {goals.length > 0 && (
                <Select value={newGoalId} onChange={(e) => setNewGoalId(e.target.value)}>
                  <option value="">No goal</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.statement}
                    </option>
                  ))}
                </Select>
              )}
              <Button type="submit" disabled={!newTitle.trim()} className="self-start">
                Add
              </Button>
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="mt-3 text-sm text-accent transition-colors hover:text-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              + Add habit
            </button>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <Link
            href="/meditation"
            className="block text-sm text-muted underline decoration-muted/40 underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            Meditate →
          </Link>
          <Link
            href="/mindset"
            className="block text-sm text-muted underline decoration-muted/40 underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            Something happened →
          </Link>
        </div>
      </div>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageShell>
  );
}
