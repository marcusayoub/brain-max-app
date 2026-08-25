"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Quote = { id: string; text: string; source: string | null };

export function QuotesSection({ userId }: { userId: string }) {
  const supabase = createClient();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [source, setSource] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("quotes")
        .select("id, text, source")
        .order("added_at", { ascending: false });
      setQuotes((data as Quote[]) ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    const { data, error } = await supabase
      .from("quotes")
      .insert({ user_id: userId, text: text.trim(), source: source.trim() || null })
      .select()
      .single();

    if (!error) {
      setQuotes((prev) => [data as Quote, ...prev]);
      setText("");
      setSource("");
    }
  }

  if (loading) return null;

  return (
    <section>
      <p className="mb-3 text-sm font-medium uppercase tracking-[0.08em] text-muted">
        Quotes
      </p>

      {quotes.length > 0 ? (
        <ul className="mb-4 flex flex-col gap-3">
          {quotes.map((quote) => (
            <li key={quote.id} className="text-foreground">
              <span className="leading-relaxed">&ldquo;{quote.text}&rdquo;</span>
              {quote.source && (
                <span className="ml-2 text-sm text-muted">— {quote.source}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-muted">
          Collect the lines that stick with you.
        </p>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="A quote worth keeping"
          className="flex-1"
        />
        <Input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Source (optional)"
          className="sm:w-40"
        />
        <Button type="submit" disabled={!text.trim()}>
          Add
        </Button>
      </form>
    </section>
  );
}
