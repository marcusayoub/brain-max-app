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

function parseTags(input: string) {
  return input
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editTagsInput, setEditTagsInput] = useState("");

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

    const { data, error } = await supabase
      .from("quotes")
      .insert({
        user_id: userId,
        text: text.trim(),
        author: author.trim() || null,
        note: note.trim() || null,
        tags: parseTags(tagsInput),
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

  async function handleEditSave(id: string) {
    if (!editText.trim()) return;
    const { error } = await supabase
      .from("quotes")
      .update({
        text: editText.trim(),
        author: editAuthor.trim() || null,
        note: editNote.trim() || null,
        tags: parseTags(editTagsInput),
      })
      .eq("id", id);
    if (error) {
      setToast(error.message);
      return;
    }
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              text: editText.trim(),
              author: editAuthor.trim() || null,
              note: editNote.trim() || null,
              tags: parseTags(editTagsInput),
            }
          : q,
      ),
    );
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("quotes").delete().eq("id", id);
    if (error) {
      setToast(error.message);
      return;
    }
    setQuotes((prev) => prev.filter((q) => q.id !== id));
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
          {filtered.map((quote) =>
            editingId === quote.id ? (
              <li key={quote.id} className="rounded-2xl bg-surface p-4">
                <div className="flex flex-col gap-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className={textareaStyles}
                    autoFocus
                  />
                  <Input
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    placeholder="Author (optional)"
                  />
                  <Input
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Note (optional)"
                  />
                  <Input
                    value={editTagsInput}
                    onChange={(e) => setEditTagsInput(e.target.value)}
                    placeholder="Tags, comma separated (optional)"
                  />
                  <div className="flex gap-4 text-sm">
                    <button
                      onClick={() => handleEditSave(quote.id)}
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
              </li>
            ) : (
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
                <div className="mt-3 flex gap-4 text-sm text-muted">
                  <button
                    onClick={() => {
                      setEditingId(quote.id);
                      setEditText(quote.text);
                      setEditAuthor(quote.author ?? "");
                      setEditNote(quote.note ?? "");
                      setEditTagsInput(quote.tags.join(", "));
                    }}
                    className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(quote.id)}
                    className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ),
          )}
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
            className="mt-6 text-sm text-accent transition-colors hover:text-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            + Add quote
          </button>
        )}
      </div>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageShell>
  );
}
