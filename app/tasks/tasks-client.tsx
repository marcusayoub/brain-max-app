"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { SwipeRow } from "@/components/ui/swipe-row";
import { PageShell } from "@/components/page-shell";
import { Toast } from "@/components/ui/toast";
import { todayLocal } from "@/lib/date";
import { type Area, type Task, type Goal, areaLastActivity, daysBetween } from "./types";
import { AreaSelector } from "./area-selector";
import { AreaManager } from "./area-manager";
import { NeglectSignal } from "./neglect-signal";
import { WeeklyRollup } from "./weekly-rollup";

const NUDGE_AT = 2;

const STARTER_AREAS = [
  { name: "Business", color: "#7b93a8", position: 0, is_default: false },
  { name: "Family", color: "#b98a8a", position: 1, is_default: false },
  { name: "Health", color: "#8aab8f", position: 2, is_default: false },
  { name: "Learning", color: "#c2a06b", position: 3, is_default: false },
  { name: "Personal", color: "#a08cc0", position: 4, is_default: true },
];

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

function pickDefaultArea(areas: Area[], tasks: Task[], today: string): string | "all" {
  if (areas.length === 0) return "all";

  const overdueCounts = new Map<string, number>();
  for (const t of tasks) {
    if (t.status === "open" && t.scheduled_date < today) {
      overdueCounts.set(t.area_id, (overdueCounts.get(t.area_id) ?? 0) + 1);
    }
  }

  let best = areas[0];
  let bestOverdue = overdueCounts.get(best.id) ?? 0;
  for (const a of areas.slice(1)) {
    const c = overdueCounts.get(a.id) ?? 0;
    if (c > bestOverdue) {
      best = a;
      bestOverdue = c;
    }
  }
  if (bestOverdue > 0) return best.id;

  const now = new Date();
  let staleArea = areas[0];
  let staleDays = -1;
  for (const a of areas) {
    const last = areaLastActivity(a.id, tasks);
    const days = last ? daysBetween(last, now) : Number.MAX_SAFE_INTEGER;
    if (days > staleDays) {
      staleDays = days;
      staleArea = a;
    }
  }
  return staleArea.id;
}

export default function TasksClient() {
  const supabase = createClient();
  const today = todayLocal();

  const [userId, setUserId] = useState<string | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAreaId, setActiveAreaId] = useState<string | "all">("all");
  const [view, setView] = useState<"tasks" | "manage" | "rollup">("tasks");
  const [nudgingId, setNudgingId] = useState<string | null>(null);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newGoalId, setNewGoalId] = useState("");
  const [newAreaId, setNewAreaId] = useState("");
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function loadAll() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [areasRes, goalsRes, tasksRes] = await Promise.all([
      supabase.from("areas").select("*").order("position", { ascending: true }),
      supabase.from("goals").select("id, statement, area_id").eq("status", "active").order("created_at", { ascending: true }),
      supabase
        .from("tasks")
        .select("id, title, goal_id, area_id, status, scheduled_date, carry_over_count, created_at, completed_at")
        .order("created_at", { ascending: true }),
    ]);

    let areasList = (areasRes.data as Area[]) ?? [];
    if (areasList.length === 0) {
      const { data: inserted, error: seedError } = await supabase
        .from("areas")
        .insert(STARTER_AREAS.map((a) => ({ ...a, user_id: user.id })))
        .select();
      if (!seedError) areasList = (inserted as Area[]) ?? [];
    }

    const tasksList = (tasksRes.data as Task[]) ?? [];

    setAreas(areasList);
    setGoals((goalsRes.data as Goal[]) ?? []);
    setTasks(tasksList);
    setActiveAreaId(pickDefaultArea(areasList, tasksList, today));
    const defaultArea = areasList.find((a) => a.is_default);
    if (defaultArea) setNewAreaId(defaultArea.id);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !userId) return;

    const selectedGoal = goals.find((g) => g.id === newGoalId);
    const areaId = selectedGoal?.area_id ?? (activeAreaId !== "all" ? activeAreaId : newAreaId);
    if (!areaId) return;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title: newTitle.trim(),
        goal_id: newGoalId || null,
        area_id: areaId,
        scheduled_date: today,
      })
      .select("id, title, goal_id, area_id, status, scheduled_date, carry_over_count, created_at, completed_at")
      .single();

    if (error) {
      setToast(error.message);
      return;
    }
    setTasks((prev) => [...prev, data as Task]);
    setNewTitle("");
    setNewGoalId("");
    setAdding(false);
  }

  async function handleComplete(task: Task) {
    const completedAt = new Date().toISOString();
    const { error } = await supabase
      .from("tasks")
      .update({ status: "done", completed_at: completedAt })
      .eq("id", task.id);
    if (error) {
      setToast(error.message);
      return;
    }
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: "done", completed_at: completedAt } : t)),
    );
  }

  async function handleCarryOver(task: Task) {
    if (task.carry_over_count >= NUDGE_AT) {
      setNudgingId(task.id);
      return;
    }
    const nextCount = task.carry_over_count + 1;
    const tomorrow = todayLocal(1);
    const { error } = await supabase
      .from("tasks")
      .update({ scheduled_date: tomorrow, carry_over_count: nextCount })
      .eq("id", task.id);
    if (error) {
      setToast(error.message);
      return;
    }
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, scheduled_date: tomorrow, carry_over_count: nextCount } : t,
      ),
    );
  }

  async function handleNudgeKeep(task: Task) {
    const { error } = await supabase.from("tasks").update({ carry_over_count: 0 }).eq("id", task.id);
    if (error) {
      setToast(error.message);
      return;
    }
    setNudgingId(null);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, carry_over_count: 0 } : t)));
  }

  async function handleNudgeReschedule(task: Task) {
    const nextCount = task.carry_over_count + 1;
    const tomorrow = todayLocal(1);
    const { error } = await supabase
      .from("tasks")
      .update({ scheduled_date: tomorrow, carry_over_count: nextCount })
      .eq("id", task.id);
    if (error) {
      setToast(error.message);
      return;
    }
    setNudgingId(null);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, scheduled_date: tomorrow, carry_over_count: nextCount } : t,
      ),
    );
  }

  async function handleNudgeLetGo(task: Task) {
    const { error } = await supabase.from("tasks").update({ status: "let_go" }).eq("id", task.id);
    if (error) {
      setToast(error.message);
      return;
    }
    setNudgingId(null);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: "let_go" } : t)));
  }

  async function handleMoveTaskArea(taskId: string, newAreaIdValue: string) {
    setMovingTaskId(null);
    const { error } = await supabase.from("tasks").update({ area_id: newAreaIdValue }).eq("id", taskId);
    if (error) {
      setToast(error.message);
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, area_id: newAreaIdValue } : t)));
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

  if (view === "manage" && userId) {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl px-6 pt-2">
          <AreaManager
            userId={userId}
            areas={areas}
            onBack={() => setView("tasks")}
            onChanged={() => {
              setView("tasks");
              loadAll();
            }}
            onError={setToast}
          />
        </div>
        <Toast message={toast} onDismiss={() => setToast(null)} />
      </PageShell>
    );
  }

  if (view === "rollup") {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl px-6 pt-2">
          <WeeklyRollup areas={areas} tasks={tasks} onBack={() => setView("tasks")} />
        </div>
      </PageShell>
    );
  }

  const goalById = new Map(goals.map((g) => [g.id, g.statement]));
  const areaById = new Map(areas.map((a) => [a.id, a]));

  const openTasks = tasks.filter((t) => t.status === "open");
  const tomorrow = todayLocal(1);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const inActiveArea = (t: Task) => activeAreaId === "all" || t.area_id === activeAreaId;

  const todayTasks = openTasks.filter((t) => t.scheduled_date <= today && inActiveArea(t));
  const tomorrowTasks = openTasks.filter((t) => t.scheduled_date === tomorrow && inActiveArea(t));
  const doneTasks = tasks.filter(
    (t) =>
      t.status === "done" &&
      t.completed_at &&
      new Date(t.completed_at) >= startOfToday &&
      new Date(t.completed_at) < startOfTomorrow &&
      inActiveArea(t),
  );

  const goalOptions = goals.filter(
    (g) => g.area_id && (activeAreaId === "all" || g.area_id === activeAreaId),
  );

  const headerLabel = activeAreaId === "all" ? "All areas" : areaById.get(activeAreaId)?.name ?? "Today";

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-6 pt-2">
        <p className="mb-1 text-sm font-medium uppercase tracking-[0.08em] text-muted">
          {headerLabel}
        </p>
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-foreground">
          {todayTasks.length} waiting on you
        </h1>
        <p className="mt-2 text-sm text-muted">
          Swipe right to finish · left to push to tomorrow
        </p>

        <AreaSelector
          areas={areas}
          tasks={tasks}
          activeAreaId={activeAreaId}
          onSelect={setActiveAreaId}
          onManage={() => setView("manage")}
        />

        {userId && <NeglectSignal userId={userId} areas={areas} tasks={tasks} />}

        <div className="mt-6 flex flex-col gap-3">
          {todayTasks.length === 0 && (
            <p className="text-muted">Nothing open right now.</p>
          )}
          {todayTasks.map((task) =>
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
                      {activeAreaId === "all" && areaById.get(task.area_id)
                        ? `${areaById.get(task.area_id)!.name} · `
                        : ""}
                      sitting {daysSitting(task.created_at)}{" "}
                      {daysSitting(task.created_at) === 1 ? "day" : "days"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                    {!task.goal_id &&
                      (movingTaskId === task.id ? (
                        <select
                          autoFocus
                          value={task.area_id}
                          onChange={(e) => handleMoveTaskArea(task.id, e.target.value)}
                          onBlur={() => setMovingTaskId(null)}
                          className="rounded-lg border border-border bg-surface-2 px-1.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:border-accent"
                        >
                          {areas.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setMovingTaskId(task.id)}
                          aria-label="Move to a different area"
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: areaById.get(task.area_id)?.color }}
                          />
                        </button>
                      ))}
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
            {goalOptions.length > 0 && (
              <Select value={newGoalId} onChange={(e) => setNewGoalId(e.target.value)}>
                <option value="">No goal</option>
                {goalOptions.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.statement}
                  </option>
                ))}
              </Select>
            )}
            {activeAreaId === "all" && !newGoalId && (
              <Select value={newAreaId} onChange={(e) => setNewAreaId(e.target.value)}>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
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
            className="mt-6 text-sm text-accent transition-colors hover:text-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            + Add task
          </button>
        )}

        {tomorrowTasks.length > 0 && (
          <div className="mt-10">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.08em] text-muted">
              Tomorrow
            </p>
            <ul className="flex flex-col gap-3">
              {tomorrowTasks.map((task) => (
                <li key={task.id} className="rounded-2xl bg-surface p-4">
                  <p className="text-foreground">{task.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {task.goal_id && goalById.get(task.goal_id)
                      ? goalById.get(task.goal_id)
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {doneTasks.length > 0 && (
          <div className="mt-10">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.08em] text-muted">
              Done
            </p>
            <ul className="flex flex-col gap-2">
              {doneTasks.map((task) => (
                <li key={task.id} className="text-sm text-muted line-through">
                  {task.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => setView("rollup")}
          className="mt-10 block text-sm text-muted underline decoration-muted/40 underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          Weekly rollup →
        </button>
      </div>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageShell>
  );
}
