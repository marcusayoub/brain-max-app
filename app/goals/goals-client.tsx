"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white px-6 py-16 dark:bg-black">
      <h1 className="mb-8 text-2xl font-semibold text-black dark:text-white">
        Goals
      </h1>

      <div className="mb-12 flex flex-col gap-6">
        {activeGoals.length === 0 && (
          <p className="text-zinc-500">
            No goals yet. Write one below — what would be true in six months
            that isn&apos;t true now?
          </p>
        )}
        {activeGoals.map((goal) => (
          <div key={goal.id} className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
            {editingId === goal.id ? (
              <div className="flex flex-col gap-2">
                <input
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  className="rounded border border-zinc-300 bg-white px-3 py-2 text-black dark:border-zinc-700 dark:bg-black dark:text-white"
                />
                <div className="flex gap-3 text-sm">
                  <button
                    onClick={() => handleEditSave(goal.id)}
                    className="text-[#1B4DFF]"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-zinc-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-2xl font-semibold leading-snug tracking-tight text-[#1B4DFF]">
                  {goal.statement}
                </p>
                <div className="mt-2 flex gap-4 text-sm text-zinc-500">
                  <button
                    onClick={() => {
                      setEditingId(goal.id);
                      setEditDraft(goal.statement);
                    }}
                  >
                    Edit
                  </button>
                  <button onClick={() => handleRetire(goal.id)}>
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
            <p className="rounded bg-zinc-100 px-3 py-2 text-sm text-black dark:bg-zinc-900 dark:text-white">
              {question}
            </p>
          )}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="In six months, I will have..."
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-black dark:border-zinc-700 dark:bg-black dark:text-white"
          />
          <button
            type="submit"
            disabled={checking || !draft.trim()}
            className="self-start rounded bg-black px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {checking ? "Checking..." : question ? "Save goal" : "Add goal"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      ) : (
        <p className="text-sm text-zinc-500">
          You have {MAX_ACTIVE_GOALS} active goals, the max. Retire one to add
          another.
        </p>
      )}

      {retiredGoals.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-3 text-sm font-medium text-zinc-500">Retired</h2>
          <ul className="flex flex-col gap-2">
            {retiredGoals.map((goal) => (
              <li key={goal.id} className="text-sm text-zinc-400 line-through">
                {goal.statement}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
