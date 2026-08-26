"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";

type Result = {
  reflection: string | null;
  habitCompletions: number;
  tasksCompleted: number;
};

export default function ProgressClient() {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/progress/reflect")
      .then((res) => res.json())
      .then(setResult)
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-6 pt-2">
        <h1 className="mb-8 text-sm font-medium uppercase tracking-[0.08em] text-muted">
          This week
        </h1>

        {loading && <p className="text-muted">Looking back...</p>}

        {!loading && result?.reflection && (
          <div className="flex flex-col gap-6">
            <p className="text-xl leading-relaxed text-foreground">
              {result.reflection}
            </p>
            <div className="flex gap-6 text-sm text-muted">
              <span>{result.habitCompletions} habit check-ins</span>
              <span>{result.tasksCompleted} tasks completed</span>
            </div>
          </div>
        )}

        {!loading && !result?.reflection && (
          <p className="text-lg leading-relaxed text-muted">
            Not much here yet — come back once you&apos;ve used Daily for a
            few days, and this will start reflecting something real back.
          </p>
        )}
      </div>
    </PageShell>
  );
}
