"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { todayLocal } from "@/lib/date";

export default function WriteClient() {
  const supabase = createClient();
  const today = todayLocal();

  const [userId, setUserId] = useState<string | null>(null);
  const [entry, setEntry] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("diary_entries")
        .select("evening_entry")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (data?.evening_entry) {
        setEntry(data.evening_entry);
        setStatus("saved");
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(value: string) {
    setEntry(value);
    setStatus("idle");
  }

  async function handleSave() {
    if (!userId || !entry.trim()) return;
    setStatus("saving");
    const { error } = await supabase.from("diary_entries").upsert(
      { user_id: userId, date: today, evening_entry: entry.trim() },
      { onConflict: "user_id,date" },
    );
    if (error) {
      setStatus("idle");
      setToast(error.message);
      return;
    }
    setStatus("saved");
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

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <PageShell>
      <div className="mx-auto flex max-w-2xl flex-col px-6 pt-2">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium uppercase tracking-[0.08em] text-muted">
            {dateLabel}
          </p>
          {status === "saved" && <span className="text-xs text-muted">Saved</span>}
        </div>
        <textarea
          value={entry}
          onChange={(e) => handleChange(e.target.value)}
          autoFocus
          placeholder="Start anywhere."
          className="min-h-[50vh] w-full resize-none bg-transparent font-serif text-2xl italic leading-relaxed text-foreground placeholder:text-muted/60 focus-visible:outline-none"
        />
        <Button
          onClick={handleSave}
          disabled={status === "saving" || !entry.trim()}
          className="mt-4 self-start"
        >
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : "Save"}
        </Button>
      </div>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageShell>
  );
}
