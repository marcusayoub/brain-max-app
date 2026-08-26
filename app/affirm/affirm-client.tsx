"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/page-shell";

type Affirmation = { id: string; text: string };

const textareaStyles =
  "min-h-20 w-full resize-none rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-[15px] text-foreground " +
  "placeholder:text-muted transition-[box-shadow,border-color] duration-150 " +
  "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25";

export default function AffirmClient() {
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("affirmations")
        .select("id, text")
        .order("created_at", { ascending: true });
      setAffirmations((data as Affirmation[]) ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function next() {
    setIndex((i) => (i + 1) % affirmations.length);
  }

  function prev() {
    setIndex((i) => (i - 1 + affirmations.length) % affirmations.length);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !userId) return;

    const { data, error } = await supabase
      .from("affirmations")
      .insert({ user_id: userId, text: draft.trim() })
      .select("id, text")
      .single();

    if (!error) {
      setAffirmations((prev) => {
        const next = [...prev, data as Affirmation];
        setIndex(next.length - 1);
        return next;
      });
      setDraft("");
      setAdding(false);
    }
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

  const current = affirmations[index];

  return (
    <PageShell>
      <div className="mx-auto flex max-w-2xl flex-col px-6 pt-2">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-sm font-medium uppercase tracking-[0.08em] text-muted">
            Affirm
          </p>
          <button
            onClick={() => setAdding(true)}
            aria-label="Add affirmation"
            className="text-lg text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            +
          </button>
        </div>

        {affirmations.length === 0 && !adding && (
          <p className="mt-16 text-center text-muted">
            Nothing here yet — add an affirmation that&apos;s true for you.
          </p>
        )}

        {affirmations.length > 0 && current && (
          <button
            onClick={next}
            aria-label="Next affirmation"
            className="flex min-h-[50vh] flex-1 items-center justify-center px-2 text-center focus-visible:outline-none"
          >
            <p className="font-serif text-3xl italic leading-snug text-foreground sm:text-4xl">
              {current.text}
            </p>
          </button>
        )}

        {affirmations.length > 0 && (
          <div className="mb-10 flex items-center justify-center gap-6">
            <button
              onClick={prev}
              aria-label="Previous affirmation"
              className="text-lg text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              ‹
            </button>
            <span className="text-sm text-muted">
              {index + 1} / {affirmations.length}
            </span>
            <button
              onClick={next}
              aria-label="Next affirmation"
              className="text-lg text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              ›
            </button>
          </div>
        )}

        {adding && (
          <form onSubmit={handleAdd} className="flex flex-col gap-2 pb-6">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              placeholder="I am..."
              className={textareaStyles}
            />
            <Button type="submit" disabled={!draft.trim()} className="self-start">
              Save
            </Button>
          </form>
        )}
      </div>
    </PageShell>
  );
}
