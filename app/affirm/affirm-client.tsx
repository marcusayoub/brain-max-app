"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/page-shell";
import { Toast } from "@/components/ui/toast";

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
  const [toast, setToast] = useState<string | null>(null);

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

    if (error) {
      setToast(error.message);
      return;
    }
    setAffirmations((prev) => {
      const next = [...prev, data as Affirmation];
      setIndex(next.length - 1);
      return next;
    });
    setDraft("");
    setAdding(false);
  }

  async function handleEditSave(id: string) {
    if (!editDraft.trim()) return;
    const { error } = await supabase
      .from("affirmations")
      .update({ text: editDraft.trim() })
      .eq("id", id);
    if (error) {
      setToast(error.message);
      return;
    }
    setAffirmations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, text: editDraft.trim() } : a)),
    );
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("affirmations").delete().eq("id", id);
    if (error) {
      setToast(error.message);
      return;
    }
    setAffirmations((prev) => {
      const next = prev.filter((a) => a.id !== id);
      setIndex((i) => Math.min(i, Math.max(next.length - 1, 0)));
      return next;
    });
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
  const editing = editingId === current?.id;

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
            className="text-lg text-accent transition-colors hover:text-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            +
          </button>
        </div>

        {affirmations.length === 0 && !adding && (
          <p className="mt-16 text-center text-muted">
            Nothing here yet — add an affirmation that&apos;s true for you.
          </p>
        )}

        {affirmations.length > 0 && current && !editing && (
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

        {current && editing && (
          <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-3 px-2">
            <textarea
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              autoFocus
              className={textareaStyles}
            />
            <div className="flex gap-4 text-sm">
              <button
                onClick={() => handleEditSave(current.id)}
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
        )}

        {affirmations.length > 0 && (
          <div className="flex items-center justify-center gap-6">
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

        {current && !editing && (
          <div className="mb-10 flex items-center justify-center gap-5 text-sm">
            <button
              onClick={() => {
                setEditingId(current.id);
                setEditDraft(current.text);
              }}
              className="text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(current.id)}
              className="text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              Delete
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
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageShell>
  );
}
