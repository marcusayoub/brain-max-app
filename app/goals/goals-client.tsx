"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { EtchedText } from "@/components/ui/etched-text";
import { PageShell } from "@/components/page-shell";
import { Toast } from "@/components/ui/toast";
import { todayLocal } from "@/lib/date";

type Goal = {
  id: string;
  statement: string;
  description: string | null;
  status: "active" | "completed" | "archived";
  target_date: string | null;
  area_id: string | null;
  created_at: string;
};

type Area = { id: string; name: string; is_default: boolean };

type Progress = { done: number; total: number; percent: number };

export default function GoalsClient() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [progressByGoal, setProgressByGoal] = useState<Map<string, Progress>>(new Map());
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [areaId, setAreaId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editDescriptionDraft, setEditDescriptionDraft] = useState("");
  const [editAreaId, setEditAreaId] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const today = todayLocal();
      const [goalsRes, tasksRes, habitsRes, checkinsRes, areasRes] = await Promise.all([
        supabase.from("goals").select("*").order("created_at", { ascending: true }),
        supabase.from("tasks").select("id, goal_id, status").not("goal_id", "is", null),
        supabase.from("habits").select("id, goal_id").not("goal_id", "is", null),
        supabase.from("habit_logs").select("habit_id").eq("date", today).eq("completed", true),
        supabase.from("areas").select("id, name, is_default").order("position", { ascending: true }),
      ]);

      setGoals((goalsRes.data as Goal[]) ?? []);
      const areasList = (areasRes.data as Area[]) ?? [];
      setAreas(areasList);
      const defaultArea = areasList.find((a) => a.is_default) ?? areasList[0];
      if (defaultArea) setAreaId(defaultArea.id);

      const checkedToday = new Set((checkinsRes.data ?? []).map((c) => c.habit_id as string));
      const tasksByGoal = new Map<string, { done: number; total: number }>();
      for (const t of (tasksRes.data ?? []) as { goal_id: string; status: string }[]) {
        const entry = tasksByGoal.get(t.goal_id) ?? { done: 0, total: 0 };
        entry.total += 1;
        if (t.status === "done") entry.done += 1;
        tasksByGoal.set(t.goal_id, entry);
      }
      const habitsByGoal = new Map<string, { done: number; total: number }>();
      for (const h of (habitsRes.data ?? []) as { id: string; goal_id: string }[]) {
        const entry = habitsByGoal.get(h.goal_id) ?? { done: 0, total: 0 };
        entry.total += 1;
        if (checkedToday.has(h.id)) entry.done += 1;
        habitsByGoal.set(h.goal_id, entry);
      }

      const combined = new Map<string, Progress>();
      const goalIds = new Set([...tasksByGoal.keys(), ...habitsByGoal.keys()]);
      for (const goalId of goalIds) {
        const t = tasksByGoal.get(goalId) ?? { done: 0, total: 0 };
        const h = habitsByGoal.get(goalId) ?? { done: 0, total: 0 };
        const total = t.total + h.total;
        if (total === 0) continue;
        const done = t.done + h.done;
        combined.set(goalId, { done, total, percent: Math.round((done / total) * 100) });
      }
      setProgressByGoal(combined);

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const archivedGoals = goals.filter((g) => g.status === "archived");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !userId) return;
    setSaving(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        statement: draft.trim(),
        description: descriptionDraft.trim() || null,
        target_date: targetDate || null,
        area_id: areaId || null,
      })
      .select()
      .single();

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setGoals((prev) => [...prev, data as Goal]);
    setDraft("");
    setDescriptionDraft("");
    setTargetDate("");
  }

  async function handleArchive(id: string) {
    const { error: updateError } = await supabase
      .from("goals")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, status: "archived" } : g)));
  }

  async function handleComplete(id: string) {
    const { error: updateError } = await supabase
      .from("goals")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, status: "completed" } : g)));
  }

  async function handleEditSave(id: string) {
    if (!editDraft.trim()) return;
    const newAreaId = editAreaId || null;
    const goal = goals.find((g) => g.id === id);
    const areaChanged = goal && goal.area_id !== newAreaId;

    const { error: updateError } = await supabase
      .from("goals")
      .update({
        statement: editDraft.trim(),
        description: editDescriptionDraft.trim() || null,
        area_id: newAreaId,
      })
      .eq("id", id);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    // A goal's tasks inherit its area — keep them from drifting out of
    // sync the moment the goal itself moves to a different area.
    if (areaChanged && newAreaId) {
      const { error: cascadeError } = await supabase
        .from("tasks")
        .update({ area_id: newAreaId })
        .eq("goal_id", id);
      if (cascadeError) {
        setError(cascadeError.message);
        return;
      }
    }

    setGoals((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              statement: editDraft.trim(),
              description: editDescriptionDraft.trim() || null,
              area_id: newAreaId,
            }
          : g,
      ),
    );
    setEditingId(null);
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

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-6 pt-2">
        <h1 className="mb-8 text-sm font-medium uppercase tracking-[0.08em] text-muted">
          Goals
        </h1>

        <div className="mb-10 flex flex-col gap-5">
          {activeGoals.length === 0 && (
            <p className="text-lg leading-relaxed text-muted">
              No goals yet. What&apos;s something you want to be true later?
            </p>
          )}
          {activeGoals.map((goal) => {
            const progress = progressByGoal.get(goal.id);
            return (
              <div key={goal.id} className="rounded-3xl bg-surface p-5">
                {editingId === goal.id ? (
                  <div className="flex flex-col gap-3">
                    <Input
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      autoFocus
                    />
                    <Input
                      value={editDescriptionDraft}
                      onChange={(e) => setEditDescriptionDraft(e.target.value)}
                      placeholder="A line about why (optional)"
                    />
                    {areas.length > 0 && (
                      <Select value={editAreaId} onChange={(e) => setEditAreaId(e.target.value)}>
                        <option value="">No area</option>
                        {areas.map((area) => (
                          <option key={area.id} value={area.id}>
                            {area.name}
                          </option>
                        ))}
                      </Select>
                    )}
                    <div className="flex gap-4 text-sm">
                      <button
                        onClick={() => handleEditSave(goal.id)}
                        className="font-medium text-accent transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <EtchedText className="text-2xl sm:text-3xl">{goal.statement}</EtchedText>
                    {goal.description && (
                      <p className="font-serif mt-1 italic text-muted">{goal.description}</p>
                    )}
                    {goal.target_date && (
                      <p className="mt-2 text-sm text-muted">
                        Target: {formatDate(goal.target_date)}
                      </p>
                    )}
                    {!goal.area_id && (
                      <p className="mt-2 text-sm text-muted">No area</p>
                    )}
                    {progress && (
                      <div className="mt-3">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                        <p className="mt-1.5 text-xs text-muted">
                          {progress.done} of {progress.total}
                        </p>
                      </div>
                    )}
                    <div className="mt-4 flex gap-5 text-sm text-muted">
                      <button
                        onClick={() => {
                          setEditingId(goal.id);
                          setEditDraft(goal.statement);
                          setEditDescriptionDraft(goal.description ?? "");
                          setEditAreaId(goal.area_id ?? "");
                        }}
                        className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleComplete(goal.id)}
                        className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                      >
                        Mark complete
                      </button>
                      <button
                        onClick={() => handleArchive(goal.id)}
                        className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                      >
                        Archive
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="A goal worth naming"
          />
          <Input
            value={descriptionDraft}
            onChange={(e) => setDescriptionDraft(e.target.value)}
            placeholder="A line about why (optional)"
          />
          <Input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="text-muted"
          />
          {areas.length > 0 && (
            <Select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </Select>
          )}
          <Button type="submit" disabled={saving || !draft.trim()} className="self-start">
            {saving ? "Saving..." : "Add goal"}
          </Button>
        </form>

        {completedGoals.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-[0.08em] text-muted">
              Completed
            </h2>
            <ul className="flex flex-col gap-2">
              {completedGoals.map((goal) => (
                <li key={goal.id} className="text-sm text-foreground">
                  {goal.statement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {archivedGoals.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-[0.08em] text-muted">
              Archived
            </h2>
            <ul className="flex flex-col gap-2">
              {archivedGoals.map((goal) => (
                <li key={goal.id} className="text-sm text-muted line-through">
                  {goal.statement}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Toast message={error} onDismiss={() => setError(null)} />
    </PageShell>
  );
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
