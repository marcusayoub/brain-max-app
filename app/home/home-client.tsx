"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AppNav } from "@/components/nav";
import { TasksSection } from "./tasks-section";
import { HabitsSection } from "./habits-section";
import { EveningSection } from "./evening-section";
import { QuotesSection } from "./quotes-section";

type Goal = { id: string; statement: string };

export default function HomeClient() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("goals")
        .select("id, statement")
        .eq("status", "active")
        .order("created_at", { ascending: true });
      setGoals((data as Goal[]) ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppNav />
      <div className="mx-auto flex max-w-2xl flex-col gap-10 px-6 pb-16 pt-10 sm:pt-12">
        <TasksSection userId={userId} goals={goals} />
        <div className="border-t border-border pt-10">
          <HabitsSection userId={userId} goals={goals} />
        </div>
        <div className="border-t border-border pt-10">
          <EveningSection userId={userId} />
        </div>
        <div className="border-t border-border pt-10">
          <QuotesSection userId={userId} />
        </div>
      </div>
    </div>
  );
}
