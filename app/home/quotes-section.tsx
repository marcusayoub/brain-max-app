"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Quote = { id: string; text: string; author: string | null; note: string | null };

export function QuotesSection({ userId }: { userId: string }) {
  const supabase = createClient();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [note, setNote] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("quotes")
        .select("id, text, author, note")
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
      .insert({
        user_id: userId,
        text: text.trim(),
        author: author.trim() || null,
        note: note.trim() || null,
      })
      .select()
      .single();

    if (!error) {
      setQuotes((prev) => [data as Quote, ...prev]);
      setText("");
      setAuthor("");
      setNote("");
      setExpanded(false);
    }
  }

  if (loading) return null;

  return (
    <section>
      <p className="mb-3 text-sm font-medium uppercase tracking-[0.08em] text-muted">
        Quotes
      </p>

      {quotes.length > 0 ? (
        <ul className="mb-6 flex flex-col gap-5">
          {quotes.map((quote) => (
            <li key={quote.id} className="rounded-xl bg-surface p-4">
              <p className="text-lg leading-relaxed text-foreground">
                &ldquo;{quote.text}&rdquo;
              </p>
              {quote.author && (
                <p className="mt-1 text-sm text-muted">— {quote.author}</p>
              )}
              {quote.note && (
                <p className="mt-2 text-sm leading-relaxed text-muted">{quote.note}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-6 text-muted">Collect the lines that stick with you.</p>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-2">
        <Input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value) setExpanded(true);
          }}
          placeholder="A quote worth keeping"
        />
        {expanded && (
          <>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author (optional)"
            />
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why it stuck with you (optional)"
            />
          </>
        )}
        <Button type="submit" disabled={!text.trim()} className="self-start">
          Add
        </Button>
      </form>
    </section>
  );
}
