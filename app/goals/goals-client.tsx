"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EtchedText } from "@/components/ui/etched-text";
import { AppNav } from "@/components/nav";

type Goal = {
  id: string;
  statement: string;
  status: "active" | "completed" | "archived";
  target_date: string | null;
  created_at: string;
};

export default function GoalsClient() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: true });
      setGoals((data as Goal[]) ?? []);
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
        target_date: targetDate || null,
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
    setTargetDate("");
  }

  async function handleArchive(id: string) {
    const { error: updateError } = await supabase
      .from("goals")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .eq("id", id);
    if (!updateError) {
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, status: "archived" } : g)),
      );
    }
  }

  async function handleComplete(id: string) {
    const { error: updateError } = await supabase
      .from("goals")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", id);
    if (!updateError) {
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, status: "completed" } : g)),
      );
    }
  }

  async function handleEditSave(id: string) {
    if (!editDraft.trim()) return;
    const { error: updateError } = await supabase
      .from("goals")
      .update({ statement: editDraft.trim() })
      .eq("id", id);
    if (!updateError) {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === id ? { ...g, statement: editDraft.trim() } : g,
        ),
      );
      setEditingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppNav />
      <div className="mx-auto max-w-2xl px-6 pb-16 pt-10 sm:pt-12">
        <h1 className="mb-8 text-sm font-medium uppercase tracking-[0.08em] text-muted">
          Goals
        </h1>

        <div className="mb-10 flex flex-col gap-8">
          {activeGoals.length === 0 && (
            <p className="text-lg leading-relaxed text-muted">
              No goals yet. What&apos;s something you want to be true later?
            </p>
          )}
          {activeGoals.map((goal) => (
            <div
              key={goal.id}
              className="rounded-xl border border-border bg-surface p-5"
            >
              {editingId === goal.id ? (
                <div className="flex flex-col gap-3">
                  <Input
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    autoFocus
                  />
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
                  <EtchedText className="text-2xl sm:text-3xl">
                    {goal.statement}
                  </EtchedText>
                  {goal.target_date && (
                    <p className="mt-2 text-sm text-muted">
                      Target: {formatDate(goal.target_date)}
                    </p>
                  )}
                  <div className="mt-4 flex gap-5 text-sm text-muted">
                    <button
                      onClick={() => {
                        setEditingId(goal.id);
                        setEditDraft(goal.statement);
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
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="A goal worth naming"
          />
          <Input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="text-muted"
          />
          <Button type="submit" disabled={saving || !draft.trim()} className="self-start">
            {saving ? "Saving..." : "Add goal"}
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
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
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
