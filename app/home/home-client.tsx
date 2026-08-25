"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

type Goal = { id: string; statement: string };
type Habit = { id: string; title: string; goal_id: string | null };

function todayLocal() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function HomeClient() {
  const supabase = createClient();
  const today = todayLocal();

  const [userId, setUserId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkedToday, setCheckedToday] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState("");
  const [newGoalId, setNewGoalId] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        supabase
          .from("habit_checkins")
          .select("habit_id")
          .eq("date", today),
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

  async function handleAddHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !userId) return;
    setError(null);

    const { data, error: insertError } = await supabase
      .from("habits")
      .insert({
        user_id: userId,
        title: newTitle.trim(),
        goal_id: newGoalId || null,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setHabits((prev) => [...prev, data as Habit]);
    setNewTitle("");
    setNewGoalId("");
  }

  async function toggleHabit(habitId: string) {
    if (!userId) return;
    const isChecked = checkedToday.has(habitId);

    if (isChecked) {
      const { error: deleteError } = await supabase
        .from("habit_checkins")
        .delete()
        .eq("habit_id", habitId)
        .eq("date", today);
      if (!deleteError) {
        setCheckedToday((prev) => {
          const next = new Set(prev);
          next.delete(habitId);
          return next;
        });
      }
    } else {
      const { error: insertError } = await supabase
        .from("habit_checkins")
        .insert({ habit_id: habitId, user_id: userId, date: today });
      if (!insertError) {
        setCheckedToday((prev) => new Set(prev).add(habitId));
      }
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  const unattached = habits.filter((h) => h.goal_id === null);
  const goalsWithHabits = goals.filter((g) =>
    habits.some((h) => h.goal_id === g.id),
  );

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 py-16 sm:py-24">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="text-sm font-medium uppercase tracking-[0.08em] text-muted">
          Daily Brain
        </h1>
        <Link
          href="/goals"
          className="text-sm text-muted underline decoration-muted/40 underline-offset-4 transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          Goals
        </Link>
      </div>

      <div className="mb-14 flex flex-col gap-10">
        {goalsWithHabits.map((goal) => (
          <div key={goal.id}>
            <p className="font-display mb-3 text-xl italic font-medium leading-snug tracking-[-0.01em] text-accent">
              {goal.statement}
            </p>
            <ul className="flex flex-col gap-1">
              {habits
                .filter((h) => h.goal_id === goal.id)
                .map((habit) => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    checked={checkedToday.has(habit.id)}
                    onToggle={() => toggleHabit(habit.id)}
                  />
                ))}
            </ul>
          </div>
        ))}

        {unattached.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-medium text-muted">
              Not attached to a goal
            </p>
            <ul className="flex flex-col gap-1">
              {unattached.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  checked={checkedToday.has(habit.id)}
                  onToggle={() => toggleHabit(habit.id)}
                />
              ))}
            </ul>
          </div>
        )}

        {habits.length === 0 && (
          <p className="text-lg leading-relaxed text-muted">
            No habits yet — add one below, and attach it to a goal if it
            serves one.
          </p>
        )}
      </div>

      <form onSubmit={handleAddHabit} className="flex flex-col gap-3">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New habit"
        />
        <Select
          value={newGoalId}
          onChange={(e) => setNewGoalId(e.target.value)}
        >
          <option value="">No goal</option>
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.statement}
            </option>
          ))}
        </Select>
        <Button type="submit" disabled={!newTitle.trim()} className="self-start">
          Add habit
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}

function HabitRow({
  habit,
  checked,
  onToggle,
}: {
  habit: Habit;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center gap-3 rounded-md py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-[transform,background-color,border-color] duration-150 ease-[var(--ease-spring)] group-active:scale-90 ${
            checked
              ? "border-foreground bg-foreground"
              : "border-foreground/25 group-hover:border-foreground/50"
          }`}
        >
          {checked && (
            <svg
              viewBox="0 0 12 12"
              className="h-3 w-3 text-background"
              fill="none"
            >
              <path
                d="M2.5 6.5L4.75 8.5L9.5 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <span
          className={
            checked
              ? "text-muted line-through decoration-muted/50"
              : "text-foreground"
          }
        >
          {habit.title}
        </span>
      </button>
    </li>
  );
}
