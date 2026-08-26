"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/page-shell";
import { Toast } from "@/components/ui/toast";
import { todayLocal } from "@/lib/date";

type Quote = {
  id: string;
  text: string;
  author: string | null;
  note: string | null;
  tags: string[];
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const textareaStyles =
  "min-h-20 w-full resize-none rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-[15px] text-foreground " +
  "placeholder:text-muted transition-[box-shadow,border-color] duration-150 " +
  "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25";

export default function QuotesClient() {
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState("all");

  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [note, setNote] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("quotes")
        .select("id, text, author, note, tags")
        .order("added_at", { ascending: true });
      setQuotes((data as Quote[]) ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !userId) return;

    const parsedTags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const { data, error } = await supabase
      .from("quotes")
      .insert({
        user_id: userId,
        text: text.trim(),
        author: author.trim() || null,
        note: note.trim() || null,
        tags: parsedTags,
      })
      .select("id, text, author, note, tags")
      .single();

    if (error) {
      setToast(error.message);
      return;
    }
    setQuotes((prev) => [...prev, data as Quote]);
    setText("");
    setAuthor("");
    setNote("");
    setTagsInput("");
    setAdding(false);
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

  const qod = quotes.length > 0 ? quotes[hashString(todayLocal()) % quotes.length] : null;
  const allTags = Array.from(new Set(quotes.flatMap((q) => q.tags))).sort();
  const filtered = activeTag === "all" ? quotes : quotes.filter((q) => q.tags.includes(activeTag));

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-6 pt-2">
        <p className="mb-1 text-sm font-medium uppercase tracking-[0.08em] text-muted">
          Quotes
        </p>
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-foreground">
          Quote of the day
        </h1>

        {qod && (
          <div className="mt-6 rounded-3xl bg-surface p-5">
            <p className="font-serif text-2xl italic leading-snug text-foreground">
              &ldquo;{qod.text}&rdquo;
            </p>
            {qod.author && <p className="mt-3 text-sm text-muted">— {qod.author}</p>}
            {qod.note && <p className="mt-1 text-sm text-muted">{qod.note}</p>}
          </div>
        )}

        {quotes.length === 0 && !adding && (
          <p className="mt-6 text-muted">
            No quotes yet — add one that&apos;s stuck with you.
          </p>
        )}

        {allTags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {["all", ...allTags].map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  activeTag === tag
                    ? "border-accent bg-accent text-black"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <ul className="mt-4 flex flex-col gap-3">
          {filtered.map((quote) => (
            <li key={quote.id} className="rounded-2xl bg-surface p-4">
              <p className="font-serif italic leading-snug text-foreground">
                &ldquo;{quote.text}&rdquo;
              </p>
              {quote.author && <p className="mt-2 text-xs text-muted">— {quote.author}</p>}
              {quote.note && <p className="mt-1 text-xs text-muted">{quote.note}</p>}
              {quote.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {quote.tags.map((t) => (
                    <span key={t} className="text-xs text-muted">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>

        {adding ? (
          <form onSubmit={handleAdd} className="mt-6 flex flex-col gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="A quote worth keeping"
              className={textareaStyles}
              autoFocus
            />
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author (optional)"
            />
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
            />
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Tags, comma separated (optional)"
            />
            <Button type="submit" disabled={!text.trim()} className="self-start">
              Add
            </Button>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-6 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            + Add quote
          </button>
        )}
      </div>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageShell>
  );
}
