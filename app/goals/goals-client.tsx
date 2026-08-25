"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Goal = {
  id: string;
  statement: string;
  status: "active" | "retired";
  was_vague: boolean;
  original_statement: string | null;
  created_at: string;
};

const MAX_ACTIVE_GOALS = 3;

export default function GoalsClient() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState("");
  const [question, setQuestion] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wasVagueRef = useRef(false);
  const firstDraftRef = useRef("");

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
  const retiredGoals = goals.filter((g) => g.status === "retired");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !userId) return;
    setError(null);

    // First pass on this draft: check specificity, ask one follow-up
    // question if vague, and stop there without saving.
    if (question === null) {
      setChecking(true);
      firstDraftRef.current = draft.trim();
      try {
        const res = await fetch("/api/goals/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statement: draft.trim() }),
        });
        const result = await res.json();
        setChecking(false);
        if (result.vague && result.question) {
          wasVagueRef.current = true;
          setQuestion(result.question);
          return;
        }
      } catch {
        setChecking(false);
        setError("Couldn't reach the specificity check. Try again.");
        return;
      }
    }

    // Either it was already specific, or this is the resubmit after the
    // one follow-up question — save either way.
    const { data, error: insertError } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        statement: draft.trim(),
        was_vague: wasVagueRef.current,
        original_statement: wasVagueRef.current
          ? firstDraftRef.current
          : null,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setGoals((prev) => [...prev, data as Goal]);
    setDraft("");
    setQuestion(null);
    wasVagueRef.current = false;
    firstDraftRef.current = "";
  }

  async function handleRetire(id: string) {
    const { error: updateError } = await supabase
      .from("goals")
      .update({ status: "retired", retired_at: new Date().toISOString() })
      .eq("id", id);
    if (!updateError) {
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, status: "retired" } : g)),
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
    <div className="mx-auto min-h-screen max-w-2xl px-6 py-16 sm:py-24">
      <h1 className="mb-10 text-sm font-medium uppercase tracking-[0.08em] text-muted">
        Goals
      </h1>

      <div className="mb-14 flex flex-col gap-10">
        {activeGoals.length === 0 && (
          <p className="text-lg leading-relaxed text-muted">
            No goals yet. Write one below — what would be true in six months
            that isn&apos;t true now?
          </p>
        )}
        {activeGoals.map((goal) => (
          <div
            key={goal.id}
            className="border-b border-foreground/10 pb-8 last:border-b-0"
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
                <p className="font-display text-3xl italic font-medium leading-[1.15] tracking-[-0.01em] text-accent sm:text-4xl">
                  {goal.statement}
                </p>
                <div className="mt-3 flex gap-5 text-sm text-muted">
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
                    onClick={() => handleRetire(goal.id)}
                    className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    Retire
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {activeGoals.length < MAX_ACTIVE_GOALS ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {question && (
            <p className="rounded-lg bg-accent/8 px-4 py-3 text-sm leading-relaxed text-foreground">
              {question}
            </p>
          )}
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="In six months, I will have..."
          />
          <Button
            type="submit"
            disabled={checking || !draft.trim()}
            className="self-start"
          >
            {checking ? "Checking..." : question ? "Save goal" : "Add goal"}
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      ) : (
        <p className="text-sm text-muted">
          You have {MAX_ACTIVE_GOALS} active goals, the max. Retire one to add
          another.
        </p>
      )}

      {retiredGoals.length > 0 && (
        <div className="mt-20">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-[0.08em] text-muted">
            Retired
          </h2>
          <ul className="flex flex-col gap-2">
            {retiredGoals.map((goal) => (
              <li key={goal.id} className="text-sm text-muted line-through">
                {goal.statement}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
