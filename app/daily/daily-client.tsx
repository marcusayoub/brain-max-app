"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { PageShell } from "@/components/page-shell";
import { Toast } from "@/components/ui/toast";
import { todayLocal } from "@/lib/date";
import { MonthGrid, type LogRow } from "./month-grid";
import { MissSignal } from "./miss-signal";
import { EveningClose } from "./evening-close";

type Goal = { id: string; statement: string };
type Habit = { id: string; title: string; goal_id: string | null; created_at: string };
type DayClose = { closed_at: string | null; skipped_at: string | null };

const GRID_DAYS = 35;

function formatHour(h: number) {
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${period}`;
}

function computeStreak(logs: LogRow[]): number {
  const byDate = new Map<string, LogRow[]>();
  for (const l of logs) {
    const list = byDate.get(l.date) ?? [];
    list.push(l);
    byDate.set(l.date, list);
  }

  const today = todayLocal();
  const todayLogs = byDate.get(today) ?? [];
  const todayComplete = todayLogs.length > 0 && todayLogs.every((l) => l.completed);

  let streak = todayComplete ? 1 : 0;
  for (let i = 1; i < GRID_DAYS; i++) {
    const date = todayLocal(-i);
    const dayLogs = byDate.get(date) ?? [];
    if (dayLogs.length === 0) break;
    if (!dayLogs.every((l) => l.completed)) break;
    streak++;
  }
  return streak;
}

export default function DailyClient() {
  const supabase = createClient();
  const today = todayLocal();

  const [userId, setUserId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"daily" | "close">("daily");

  const [eveningHour, setEveningHour] = useState(21);
  const [dayClose, setDayClose] = useState<DayClose | null>(null);
  const [editingHour, setEditingHour] = useState(false);
  const [hourDraft, setHourDraft] = useState(21);

  const [newTitle, setNewTitle] = useState("");
  const [newGoalId, setNewGoalId] = useState("");
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"error" | "success">("error");
  const [highlightedHabitId, setHighlightedHabitId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const windowStart = todayLocal(-(GRID_DAYS - 1));

      const [goalsRes, habitsRes, logsRes, settingsRes, closeRes] = await Promise.all([
        supabase
          .from("goals")
          .select("id, statement")
          .eq("status", "active")
          .order("created_at", { ascending: true }),
        supabase
          .from("habits")
          .select("id, title, goal_id, created_at")
          .order("created_at", { ascending: true }),
        supabase
          .from("habit_logs")
          .select("habit_id, habit_title, date, completed")
          .gte("date", windowStart),
        supabase
          .from("user_settings")
          .select("evening_close_hour")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("day_closes")
          .select("closed_at, skipped_at")
          .eq("user_id", user.id)
          .eq("date", today)
          .maybeSingle(),
      ]);

      const habitsList = (habitsRes.data as Habit[]) ?? [];
      let logsList = (logsRes.data as LogRow[]) ?? [];

      setGoals((goalsRes.data as Goal[]) ?? []);
      setHabits(habitsList);

      // Seed a completed:false row for any active habit with no log for
      // today — required so each day's grid ratio is computed from the
      // habits actually logged that day, not the current habit count.
      const loggedTodayIds = new Set(
        logsList.filter((l) => l.date === today).map((l) => l.habit_id),
      );
      const toSeed = habitsList.filter((h) => !loggedTodayIds.has(h.id));
      if (toSeed.length > 0) {
        const seedRows = toSeed.map((h) => ({
          user_id: user.id,
          habit_id: h.id,
          habit_title: h.title,
          date: today,
          completed: false,
        }));
        const { error: seedError } = await supabase
          .from("habit_logs")
          .upsert(seedRows, { onConflict: "user_id,habit_id,date", ignoreDuplicates: true });
        if (!seedError) {
          logsList = [...logsList, ...seedRows];
        }
      }

      setLogs(logsList);
      setEveningHour(settingsRes.data?.evening_close_hour ?? 21);
      const close = (closeRes.data as DayClose | null) ?? null;
      setDayClose(close);

      const hourNow = new Date().getHours();
      const configuredHour = settingsRes.data?.evening_close_hour ?? 21;
      if (hourNow >= configuredHour && !close?.closed_at && !close?.skipped_at) {
        setView("close");
      }

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkedToday = new Set(
    logs.filter((l) => l.date === today && l.completed && l.habit_id).map((l) => l.habit_id as string),
  );

  async function toggleHabit(habitId: string) {
    if (!userId) return;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const nextCompleted = !checkedToday.has(habitId);

    setLogs((prev) => {
      const idx = prev.findIndex((l) => l.habit_id === habitId && l.date === today);
      if (idx === -1) {
        return [...prev, { habit_id: habitId, habit_title: habit.title, date: today, completed: nextCompleted }];
      }
      const next = [...prev];
      next[idx] = { ...next[idx], completed: nextCompleted };
      return next;
    });

    const { error } = await supabase.from("habit_logs").upsert(
      {
        user_id: userId,
        habit_id: habitId,
        habit_title: habit.title,
        date: today,
        completed: nextCompleted,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,habit_id,date" },
    );

    if (error) {
      setToastVariant("error");
      setToast(error.message);
      setLogs((prev) => {
        const idx = prev.findIndex((l) => l.habit_id === habitId && l.date === today);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], completed: !nextCompleted };
        return next;
      });
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
      setToastVariant("error");
      setToast(error.message);
      return;
    }
    const habit = data as Habit;
    setHabits((prev) => [...prev, habit]);

    await supabase.from("habit_logs").upsert(
      {
        user_id: userId,
        habit_id: habit.id,
        habit_title: habit.title,
        date: today,
        completed: false,
      },
      { onConflict: "user_id,habit_id,date", ignoreDuplicates: true },
    );
    setLogs((prev) => [
      ...prev,
      { habit_id: habit.id, habit_title: habit.title, date: today, completed: false },
    ]);

    setNewTitle("");
    setNewGoalId("");
    setAdding(false);
  }

  async function handleDeleteHabit(habitId: string) {
    const { error } = await supabase.from("habits").delete().eq("id", habitId);
    if (error) {
      setToastVariant("error");
      setToast(error.message);
      return;
    }
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  }

  async function handleSaveHour() {
    if (!userId) return;
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: userId, evening_close_hour: hourDraft, updated_at: new Date().toISOString() });
    if (error) {
      setToastVariant("error");
      setToast(error.message);
      return;
    }
    setEveningHour(hourDraft);
    setEditingHour(false);
  }

  function handleAdjustHabit(habitId: string) {
    setHighlightedHabitId(habitId);
    document.getElementById(`habit-${habitId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlightedHabitId((cur) => (cur === habitId ? null : cur)), 2000);
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

  if (view === "close" && userId) {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl px-6 pt-2">
          <EveningClose
            userId={userId}
            habits={habits}
            checkedToday={checkedToday}
            onClose={() => {
              setDayClose((prev) => ({ closed_at: new Date().toISOString(), skipped_at: prev?.skipped_at ?? null }));
              setView("daily");
              setToastVariant("success");
              setToast("Day closed");
            }}
            onSkip={() => {
              setDayClose((prev) => ({ closed_at: prev?.closed_at ?? null, skipped_at: new Date().toISOString() }));
              setView("daily");
            }}
            onBack={() => setView("daily")}
          />
        </div>
        <Toast message={toast} onDismiss={() => setToast(null)} variant={toastVariant} />
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
  const streak = computeStreak(logs);
  const hourNow = now.getHours();
  const canManuallyClose = hourNow >= eveningHour && !dayClose?.closed_at;

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

        {streak > 0 && (
          <p className="mt-3 text-sm text-muted">
            {streak} full {streak === 1 ? "day" : "days"} in a row
          </p>
        )}

        {userId && (
          <MissSignal
            userId={userId}
            habits={habits}
            logs={logs}
            onAdjust={handleAdjustHabit}
          />
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
                <li
                  key={habit.id}
                  id={`habit-${habit.id}`}
                  className={`group flex items-center gap-1 rounded-xl transition-shadow duration-300 ${
                    highlightedHabitId === habit.id ? "ring-2 ring-accent" : ""
                  }`}
                >
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

        <MonthGrid logs={logs} />

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          {editingHour ? (
            <span className="flex items-center gap-2">
              Closes at
              <select
                value={hourDraft}
                onChange={(e) => setHourDraft(Number(e.target.value))}
                className="rounded-lg border border-transparent bg-surface px-2 py-1 text-foreground focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
              >
                {Array.from({ length: 24 }, (_, h) => h).map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSaveHour}
                className="text-accent transition-colors hover:text-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              >
                Save
              </button>
              <button
                onClick={() => setEditingHour(false)}
                className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => {
                setHourDraft(eveningHour);
                setEditingHour(true);
              }}
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              Closes at {formatHour(eveningHour)} · Change
            </button>
          )}

          {canManuallyClose && (
            <button
              onClick={() => setView("close")}
              className="text-accent transition-colors hover:text-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              Close today →
            </button>
          )}
        </div>

        <Link
          href="/mindset"
          className="mt-6 block text-sm text-muted underline decoration-muted/40 underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          Something happened →
        </Link>
      </div>
      <Toast message={toast} onDismiss={() => setToast(null)} variant={toastVariant} />
    </PageShell>
  );
}
