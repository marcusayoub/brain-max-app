"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { SwipeRow } from "@/components/ui/swipe-row";
import { Thread, ThreadNode } from "@/components/ui/thread";
import { EtchedText } from "@/components/ui/etched-text";

type Goal = { id: string; statement: string };
type Task = {
  id: string;
  title: string;
  goal_id: string | null;
  carry_over_count: number;
};

const NUDGE_AT = 2; // carry count at which the *next* carry triggers the ask

function todayLocal(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function TasksSection({
  userId,
  goals,
}: {
  userId: string;
  goals: Goal[];
}) {
  const supabase = createClient();
  const today = todayLocal();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulsingId, setPulsingId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [nudgingId, setNudgingId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newGoalId, setNewGoalId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, goal_id, carry_over_count")
        .eq("status", "open")
        .lte("scheduled_date", today)
        .order("scheduled_date", { ascending: true });
      setTasks((data as Task[]) ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setError(null);

    const { data, error: insertError } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title: newTitle.trim(),
        goal_id: newGoalId || null,
        scheduled_date: today,
      })
      .select("id, title, goal_id, carry_over_count")
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setTasks((prev) => [...prev, data as Task]);
    setNewTitle("");
    setNewGoalId("");
  }

  async function handleComplete(id: string) {
    setPulsingId(id);
    setDoneIds((prev) => new Set(prev).add(id));

    await supabase
      .from("tasks")
      .update({ status: "done", completed_at: new Date().toISOString() })
      .eq("id", id);

    setTimeout(() => {
      setPulsingId(null);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }, 700);
  }

  async function handleCarryOver(task: Task) {
    if (task.carry_over_count >= NUDGE_AT) {
      setNudgingId(task.id);
      return;
    }
    await supabase
      .from("tasks")
      .update({
        scheduled_date: todayLocal(1),
        carry_over_count: task.carry_over_count + 1,
      })
      .eq("id", task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  }

  async function handleNudgeKeep(task: Task) {
    await supabase
      .from("tasks")
      .update({ carry_over_count: 0 })
      .eq("id", task.id);
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, carry_over_count: 0 } : t)),
    );
    setNudgingId(null);
  }

  async function handleNudgeReschedule(task: Task) {
    await supabase
      .from("tasks")
      .update({
        scheduled_date: todayLocal(1),
        carry_over_count: task.carry_over_count + 1,
      })
      .eq("id", task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    setNudgingId(null);
  }

  async function handleNudgeLetGo(task: Task) {
    await supabase.from("tasks").update({ status: "let_go" }).eq("id", task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    setNudgingId(null);
  }

  if (loading) return null;

  const unattached = tasks.filter((t) => t.goal_id === null);
  const goalsWithTasks = goals.filter((g) =>
    tasks.some((t) => t.goal_id === g.id),
  );

  return (
    <section>
      <p className="mb-3 text-sm font-medium uppercase tracking-[0.08em] text-muted">
        Tasks
      </p>

      <div className="mb-6 flex flex-col gap-6">
        {goalsWithTasks.map((goal) => (
          <div key={goal.id}>
            <EtchedText className="mb-2 text-lg">{goal.statement}</EtchedText>
            <Thread>
              {tasks
                .filter((t) => t.goal_id === goal.id)
                .map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    done={doneIds.has(task.id)}
                    pulsing={pulsingId === task.id}
                    nudging={nudgingId === task.id}
                    onComplete={() => handleComplete(task.id)}
                    onCarryOver={() => handleCarryOver(task)}
                    onNudgeKeep={() => handleNudgeKeep(task)}
                    onNudgeReschedule={() => handleNudgeReschedule(task)}
                    onNudgeLetGo={() => handleNudgeLetGo(task)}
                  />
                ))}
            </Thread>
          </div>
        ))}

        {unattached.length > 0 && (
          <div>
            {goalsWithTasks.length > 0 && (
              <p className="mb-2 text-sm font-medium text-muted">
                Not attached to a goal
              </p>
            )}
            <Thread>
              {unattached.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  done={doneIds.has(task.id)}
                  pulsing={pulsingId === task.id}
                  nudging={nudgingId === task.id}
                  onComplete={() => handleComplete(task.id)}
                  onCarryOver={() => handleCarryOver(task)}
                  onNudgeKeep={() => handleNudgeKeep(task)}
                  onNudgeReschedule={() => handleNudgeReschedule(task)}
                  onNudgeLetGo={() => handleNudgeLetGo(task)}
                />
              ))}
            </Thread>
          </div>
        )}

        {tasks.length === 0 && (
          <p className="text-muted">Nothing on the list — add something below.</p>
        )}
      </div>

      <form onSubmit={handleAddTask} className="flex flex-col gap-3">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New task"
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
          Add task
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </section>
  );
}

function TaskRow({
  task,
  done,
  pulsing,
  nudging,
  onComplete,
  onCarryOver,
  onNudgeKeep,
  onNudgeReschedule,
  onNudgeLetGo,
}: {
  task: Task;
  done: boolean;
  pulsing: boolean;
  nudging: boolean;
  onComplete: () => void;
  onCarryOver: () => void;
  onNudgeKeep: () => void;
  onNudgeReschedule: () => void;
  onNudgeLetGo: () => void;
}) {
  if (nudging) {
    return (
      <ThreadNode done={false} pulse={false}>
        <div className="flex-1 rounded-lg bg-surface p-3">
          <p className="text-sm text-foreground">
            You&apos;ve carried &ldquo;{task.title}&rdquo; over a few times.
            Still important?
          </p>
          <div className="mt-2 flex gap-4 text-sm">
            <button
              onClick={onNudgeKeep}
              className="text-accent hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              Keep
            </button>
            <button
              onClick={onNudgeReschedule}
              className="text-foreground hover:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              Reschedule
            </button>
            <button
              onClick={onNudgeLetGo}
              className="text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              Let go
            </button>
          </div>
        </div>
      </ThreadNode>
    );
  }

  return (
    <ThreadNode done={done} pulse={pulsing}>
      <SwipeRow onSwipeRight={onComplete} onSwipeLeft={onCarryOver}>
        <div className="group flex flex-1 items-center justify-between gap-3 rounded-lg py-1.5 pr-1">
          <span
            className={done ? "text-muted line-through decoration-muted/50" : "text-foreground"}
          >
            {task.title}
          </span>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            <button
              onClick={onCarryOver}
              aria-label="Move to tomorrow"
              className="rounded p-1.5 text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              →
            </button>
            <button
              onClick={onComplete}
              aria-label="Complete task"
              className="rounded p-1.5 text-muted hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              ✓
            </button>
          </div>
        </div>
      </SwipeRow>
    </ThreadNode>
  );
}
