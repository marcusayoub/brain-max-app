"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deriveTitle } from "@/lib/text";

type Entry = {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
};

type View = "library" | "reading" | "writing";

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
}

function daysAgo(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startOfD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((startOfNow - startOfD) / 86400000);
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const textareaStyles =
  "min-h-[50vh] w-full resize-none bg-transparent font-serif text-2xl italic leading-relaxed text-foreground placeholder:text-muted/60 focus-visible:outline-none";

export default function WriteClient() {
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("library");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"error" | "success">("error");
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from("diary_entries")
        .select("id, title, content, created_at, updated_at")
        .not("content", "is", null)
        .order("created_at", { ascending: false });

      if (error) {
        setToastVariant("error");
        setToast(error.message);
      }
      setEntries(((data as Entry[]) ?? []).filter((e) => e.content?.trim()));
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openNew() {
    setActiveId(null);
    setDraft("");
    setView("writing");
  }

  function openEntry(entry: Entry) {
    setActiveId(entry.id);
    setView("reading");
  }

  function openEdit(entry: Entry) {
    setActiveId(entry.id);
    setDraft(entry.content);
    setView("writing");
  }

  function backToLibrary() {
    setView("library");
    setActiveId(null);
  }

  async function handleSave() {
    if (!userId || !draft.trim()) return;
    setSaving(true);
    const content = draft.trim();
    const title = deriveTitle(content);
    const now = new Date().toISOString();

    if (activeId) {
      const { error } = await supabase
        .from("diary_entries")
        .update({ content, title, updated_at: now })
        .eq("id", activeId);
      setSaving(false);
      if (error) {
        setToastVariant("error");
        setToast(error.message);
        return;
      }
      setEntries((prev) =>
        prev.map((e) => (e.id === activeId ? { ...e, content, title, updated_at: now } : e)),
      );
    } else {
      const { data, error } = await supabase
        .from("diary_entries")
        .insert({ user_id: userId, content, title })
        .select("id, title, content, created_at, updated_at")
        .single();
      setSaving(false);
      if (error) {
        setToastVariant("error");
        setToast(error.message);
        return;
      }
      setEntries((prev) => [data as Entry, ...prev]);
    }

    setDraft("");
    backToLibrary();
    setToastVariant("success");
    setToast("Saved");
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from("diary_entries").delete().eq("id", deleteTarget.id);
    if (error) {
      setToastVariant("error");
      setToast(error.message);
      setDeleteTarget(null);
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    setDeleteTarget(null);
    backToLibrary();
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

  const activeEntry = entries.find((e) => e.id === activeId) ?? null;

  const filtered = search.trim()
    ? entries.filter(
        (e) =>
          e.title?.toLowerCase().includes(search.toLowerCase()) ||
          e.content.toLowerCase().includes(search.toLowerCase()),
      )
    : entries;

  const groups = [
    { label: "Today", items: filtered.filter((e) => daysAgo(e.created_at) === 0) },
    {
      label: "This week",
      items: filtered.filter((e) => {
        const d = daysAgo(e.created_at);
        return d > 0 && d <= 7;
      }),
    },
    { label: "Earlier", items: filtered.filter((e) => daysAgo(e.created_at) > 7) },
  ].filter((g) => g.items.length > 0);

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-6 pt-2">
        {view === "library" && (
          <>
            <p className="mb-1 text-sm font-medium uppercase tracking-[0.08em] text-muted">
              Diary
            </p>
            <h1 className="font-serif text-3xl italic text-foreground">
              Your thoughts, captured over time.
            </h1>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button onClick={openNew} className="self-start">
                + New Entry
              </Button>
              {entries.length > 0 && (
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="⌕ Search reflections"
                  className="w-full rounded-lg border border-transparent bg-surface px-3.5 py-2 text-sm text-foreground placeholder:text-muted transition-[box-shadow,border-color] duration-150 focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25 sm:w-56"
                />
              )}
            </div>

            {entries.length === 0 ? (
              <div className="mt-20 flex flex-col items-center gap-4 text-center">
                <p className="font-serif text-2xl italic text-foreground">
                  Your reflections live here.
                </p>
                <p className="text-muted">
                  A quiet place to write, process, and understand yourself.
                </p>
                <Button onClick={openNew}>+ New Entry</Button>
              </div>
            ) : filtered.length === 0 ? (
              <p className="mt-10 text-muted">
                No reflections match &ldquo;{search}&rdquo;.
              </p>
            ) : (
              <div className="mt-10 flex flex-col gap-8">
                {groups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1 text-sm font-medium uppercase tracking-[0.08em] text-muted">
                      {group.label}
                    </p>
                    <ul className="flex flex-col divide-y divide-border">
                      {group.items.map((entry) => (
                        <li key={entry.id}>
                          <button
                            onClick={() => openEntry(entry)}
                            className="flex w-full flex-col gap-1 py-4 text-left transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                          >
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="text-xs text-muted">
                                {formatShortDate(entry.created_at)}
                              </span>
                              <span className="text-xs text-muted">
                                {wordCount(entry.content)} words
                              </span>
                            </div>
                            <p className="text-lg font-semibold text-foreground">
                              {entry.title || "Untitled"}
                            </p>
                            <p className="line-clamp-2 text-sm text-muted">
                              {entry.content}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {view === "reading" && activeEntry && (
          <div>
            <button
              onClick={backToLibrary}
              className="mb-6 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              ← Diary
            </button>
            <p className="text-sm font-medium uppercase tracking-[0.08em] text-muted">
              {formatFullDate(activeEntry.created_at)}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-[-0.01em] text-foreground">
              {activeEntry.title || "Untitled"}
            </h1>
            <p className="mt-6 whitespace-pre-wrap font-serif text-xl italic leading-relaxed text-foreground">
              {activeEntry.content}
            </p>
            <div className="mt-10 flex gap-5 text-sm text-muted">
              <button
                onClick={() => openEdit(activeEntry)}
                className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteTarget(activeEntry)}
                className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {view === "writing" && (
          <div className="flex flex-col">
            <button
              onClick={backToLibrary}
              className="mb-4 self-start text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              ← Diary
            </button>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              placeholder="Start anywhere."
              className={textareaStyles}
            />
            <Button
              onClick={handleSave}
              disabled={saving || !draft.trim()}
              className="mt-4 self-start"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete reflection?"
        description="This reflection will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast message={toast} onDismiss={() => setToast(null)} variant={toastVariant} />
    </PageShell>
  );
}
