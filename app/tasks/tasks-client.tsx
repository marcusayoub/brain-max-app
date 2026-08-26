"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { SwipeRow } from "@/components/ui/swipe-row";
import { PageShell } from "@/components/page-shell";
import { todayLocal } from "@/lib/date";

type Goal = { id: string; statement: string };
type Task = {
  id: string;
  title: string;
  goal_id: string | null;
  carry_over_count: number;
  created_at: string;
};

const NUDGE_AT = 2;

function daysSitting(createdAt: string) {
  const created = new Date(createdAt);
  const now = new Date();
  const diff = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
      Date.UTC(created.getFullYear(), created.getMonth(), created.getDate())) /
      86400000,
  );
  return diff;
}

export default function TasksClient() {
  const supabase = createClient();
  const today = todayLocal();

  const [userId, setUserId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [doneTasks, setDoneTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDone, setShowDone] = useState(false);
  const [nudgingId, setNudgingId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newGoalId, setNewGoalId] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [goalsRes, tasksRes, doneRes] = await Promise.all([
        supabase
          .from("goals")
          .select("id, statement")
          .eq("status", "active")
          .order("created_at", { ascending: true }),
        supabase
          .from("tasks")
          .select("id, title, goal_id, carry_over_count, created_at")
          .eq("status", "open")
          .lte("scheduled_date", today)
          .order("scheduled_date", { ascending: true }),
        supabase
          .from("tasks")
          .select("id, title, goal_id, carry_over_count, created_at")
          .eq("status", "done")
          .order("completed_at", { ascending: false })
          .limit(20),
      ]);

      setGoals((goalsRes.data as Goal[]) ?? []);
      setTasks((tasksRes.data as Task[]) ?? []);
      setDoneTasks((doneRes.data as Task[]) ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !userId) return;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title: newTitle.trim(),
        goal_id: newGoalId || null,
        scheduled_date: today,
      })
      .select("id, title, goal_id, carry_over_count, created_at")
      .single();

    if (!error) {
      setTasks((prev) => [...prev, data as Task]);
      setNewTitle("");
      setNewGoalId("");
      setAdding(false);
    }
  }

  async function handleComplete(task: Task) {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    setDoneTasks((prev) => [task, ...prev]);
    await supabase
      .from("tasks")
      .update({ status: "done", completed_at: new Date().toISOString() })
      .eq("id", task.id);
  }

  async function handleCarryOver(task: Task) {
    if (task.carry_over_count >= NUDGE_AT) {
      setNudgingId(task.id);
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await supabase
      .from("tasks")
      .update({
        scheduled_date: todayLocal(1),
        carry_over_count: task.carry_over_count + 1,
      })
      .eq("id", task.id);
  }

  async function handleNudgeKeep(task: Task) {
    setNudgingId(null);
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, carry_over_count: 0 } : t)),
    );
    await supabase.from("tasks").update({ carry_over_count: 0 }).eq("id", task.id);
  }

  async function handleNudgeReschedule(task: Task) {
    setNudgingId(null);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await supabase
      .from("tasks")
      .update({
        scheduled_date: todayLocal(1),
        carry_over_count: task.carry_over_count + 1,
      })
      .eq("id", task.id);
  }

  async function handleNudgeLetGo(task: Task) {
    setNudgingId(null);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await supabase.from("tasks").update({ status: "let_go" }).eq("id", task.id);
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

  const goalById = new Map(goals.map((g) => [g.id, g.statement]));

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-6 pt-2">
        <p className="mb-1 text-sm font-medium uppercase tracking-[0.08em] text-muted">
          Open loops
        </p>
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-foreground">
          {tasks.length} waiting on you
        </h1>
        <p className="mt-2 text-sm text-muted">
          Swipe right to finish · left to push to tomorrow
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {tasks.length === 0 && (
            <p className="text-muted">Nothing open right now.</p>
          )}
          {tasks.map((task) =>
            nudgingId === task.id ? (
              <div key={task.id} className="rounded-2xl bg-surface p-4">
                <p className="text-sm text-foreground">
                  You&apos;ve carried &ldquo;{task.title}&rdquo; over a few
                  times. Still important?
                </p>
                <div className="mt-3 flex gap-4 text-sm">
                  <button
                    onClick={() => handleNudgeKeep(task)}
                    className="text-accent hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    Keep
                  </button>
                  <button
                    onClick={() => handleNudgeReschedule(task)}
                    className="text-foreground hover:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => handleNudgeLetGo(task)}
                    className="text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    Let go
                  </button>
                </div>
              </div>
            ) : (
              <SwipeRow
                key={task.id}
                onSwipeRight={() => handleComplete(task)}
                onSwipeLeft={() => handleCarryOver(task)}
              >
                <div className="group flex items-center justify-between gap-3 rounded-2xl bg-surface p-4">
                  <div>
                    <p className="text-foreground">{task.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {task.goal_id && goalById.get(task.goal_id)
                        ? `${goalById.get(task.goal_id)} · `
                        : ""}
                      sitting {daysSitting(task.created_at)}{" "}
                      {daysSitting(task.created_at) === 1 ? "day" : "days"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                    <button
                      onClick={() => handleCarryOver(task)}
                      aria-label="Move to tomorrow"
                      className="rounded p-1.5 text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      →
                    </button>
                    <button
                      onClick={() => handleComplete(task)}
                      aria-label="Complete task"
                      className="rounded p-1.5 text-muted hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              </SwipeRow>
            ),
          )}
        </div>

        {adding ? (
          <form onSubmit={handleAddTask} className="mt-6 flex flex-col gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New task"
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
            className="mt-6 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            + Add task
          </button>
        )}

        {doneTasks.length > 0 && (
          <div className="mt-10">
            <button
              onClick={() => setShowDone((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.08em] text-muted"
            >
              Done {doneTasks.length}
              <span className={`transition-transform ${showDone ? "rotate-180" : ""}`}>
                ⌄
              </span>
            </button>
            {showDone && (
              <ul className="mt-3 flex flex-col gap-2">
                {doneTasks.map((task) => (
                  <li key={task.id} className="text-sm text-muted line-through">
                    {task.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
