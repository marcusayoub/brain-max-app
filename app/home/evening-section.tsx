"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function todayLocal() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const textareaStyles =
  "min-h-28 w-full resize-none rounded-lg border border-foreground/15 bg-background px-3.5 py-2.5 text-[15px] leading-relaxed text-foreground " +
  "placeholder:text-muted transition-[box-shadow,border-color] duration-150 " +
  "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20";

export function EveningSection({ userId }: { userId: string }) {
  const supabase = createClient();
  const today = todayLocal();

  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState("");
  const [status, setStatus] = useState<"idle" | "saved">("idle");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("diary_entries")
        .select("evening_entry")
        .eq("user_id", userId)
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!entry.trim()) return;

    await supabase.from("diary_entries").upsert(
      { user_id: userId, date: today, evening_entry: entry.trim() },
      { onConflict: "user_id,date" },
    );
    setStatus("saved");
  }

  if (loading) return null;

  return (
    <section>
      <p className="mb-3 text-sm font-medium uppercase tracking-[0.08em] text-muted">
        Evening
      </p>
      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <textarea
          value={entry}
          onChange={(e) => {
            setEntry(e.target.value);
            setStatus("idle");
          }}
          placeholder="How did today go?"
          className={textareaStyles}
        />
        <Button type="submit" disabled={!entry.trim()} className="self-start">
          {status === "saved" ? "Saved" : "Save"}
        </Button>
      </form>
    </section>
  );
}
