"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { todayLocal } from "@/lib/date";
import { deriveTitle } from "@/lib/text";

type Habit = { id: string; title: string };

export function EveningClose({
  userId,
  habits,
  checkedToday,
  onClose,
  onSkip,
  onBack,
}: {
  userId: string;
  habits: Habit[];
  checkedToday: Set<string>;
  onClose: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const supabase = createClient();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  async function handleClose() {
    setSaving(true);
    setError(null);
    const today = todayLocal();

    const { error: closeError } = await supabase
      .from("day_closes")
      .upsert({ user_id: userId, date: today, closed_at: new Date().toISOString() });

    if (closeError) {
      setSaving(false);
      setError(closeError.message);
      return;
    }

    if (note.trim()) {
      const { error: diaryError } = await supabase.from("diary_entries").insert({
        user_id: userId,
        content: note.trim(),
        title: deriveTitle(note.trim()),
        entry_type: "day_close",
      });
      if (diaryError) {
        setSaving(false);
        setError(diaryError.message);
        return;
      }
    }

    setSaving(false);
    onClose();
  }

  async function handleSkip() {
    setSaving(true);
    setError(null);
    const today = todayLocal();

    const { error: skipError } = await supabase
      .from("day_closes")
      .upsert({ user_id: userId, date: today, skipped_at: new Date().toISOString() });

    setSaving(false);
    if (skipError) {
      setError(skipError.message);
      return;
    }
    onSkip();
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        ← Back
      </button>

      <p className="mb-1 text-sm font-medium uppercase tracking-[0.08em] text-muted">
        Closing out
      </p>
      <h1 className="font-serif text-3xl italic text-foreground">{dateLabel}</h1>

      <ul className="mt-6 flex flex-col gap-1.5">
        {habits.map((habit) => {
          const checked = checkedToday.has(habit.id);
          return (
            <li key={habit.id} className="flex items-center gap-2 text-sm">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  checked ? "bg-accent" : "bg-foreground/20"
                }`}
              />
              <span className={checked ? "text-foreground" : "text-muted"}>
                {habit.title}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-sm text-muted">Anything worth remembering about today?</p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional"
        className="mt-2 min-h-32 w-full resize-none rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted transition-[box-shadow,border-color] duration-150 focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
      />

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-6 flex items-center gap-5">
        <Button onClick={handleClose} disabled={saving}>
          Close day
        </Button>
        <button
          onClick={handleSkip}
          disabled={saving}
          className="text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded disabled:opacity-40"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
