"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "situation" | "reflect" | "done";

export default function MindsetClient() {
  const supabase = createClient();
  const [step, setStep] = useState<Step>("situation");
  const [situation, setSituation] = useState("");
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [reflection, setReflection] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSituationSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!situation.trim()) return;
    setLoadingQuestions(true);
    setError(null);

    try {
      const res = await fetch("/api/mindset/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation: situation.trim() }),
      });
      const result = await res.json();
      setQuestions(result.questions ?? []);
      setAnswers(new Array((result.questions ?? []).length).fill(""));
      setStep("reflect");
    } catch {
      setError("Couldn't reach the app. Try again.");
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!reflection.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("mindset_sessions").insert({
      user_id: user.id,
      type: "reframe",
      situation: situation.trim(),
      questions,
      answers,
      reflection: reflection.trim(),
    });

    setStep("done");
  }

  function reset() {
    setStep("situation");
    setSituation("");
    setQuestions([]);
    setAnswers([]);
    setReflection("");
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-6 pt-2">
        <h1 className="mb-8 text-sm font-medium uppercase tracking-[0.08em] text-muted">
          Mindset
        </h1>

        {step === "situation" && (
          <form onSubmit={handleSituationSubmit} className="flex flex-col gap-4">
            <p className="text-lg leading-relaxed text-foreground">
              Something happened. What was it, in a sentence or two?
            </p>
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              autoFocus
              className="min-h-28 w-full resize-none rounded-xl border border-transparent bg-surface px-5 py-4 text-base leading-relaxed text-foreground placeholder:text-muted transition-[box-shadow,border-color] duration-150 focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"
              placeholder="What happened..."
            />
            <Button
              type="submit"
              disabled={loadingQuestions || !situation.trim()}
              className="self-start"
            >
              {loadingQuestions ? "Thinking..." : "Continue"}
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        )}

        {step === "reflect" && (
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            <p className="text-muted">{situation}</p>

            <div className="flex flex-col gap-4">
              {questions.map((q, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <p className="text-foreground">{q}</p>
                  <Input
                    value={answers[i] ?? ""}
                    onChange={(e) => {
                      const next = [...answers];
                      next[i] = e.target.value;
                      setAnswers(next);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 border-t border-border pt-6">
              <p className="text-foreground">
                Write your own alternate way of seeing this.
              </p>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                autoFocus
                className="min-h-28 w-full resize-none rounded-xl border border-transparent bg-surface px-5 py-4 text-base leading-relaxed text-foreground placeholder:text-muted transition-[box-shadow,border-color] duration-150 focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"
              />
            </div>

            <Button type="submit" disabled={!reflection.trim()} className="self-start">
              Save
            </Button>
          </form>
        )}

        {step === "done" && (
          <div className="flex flex-col gap-4">
            <p className="text-lg leading-relaxed text-foreground">
              Saved. That&apos;s the reading that&apos;s yours now.
            </p>
            <Button variant="secondary" onClick={reset} className="self-start">
              Start another
            </Button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
