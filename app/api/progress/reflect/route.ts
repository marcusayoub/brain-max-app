import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { PROGRESS_SYSTEM_PROMPT } from "@/lib/prompts/progress";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const since = daysAgo(7);

  const [checkinsRes, tasksRes, diaryRes] = await Promise.all([
    supabase
      .from("habit_checkins")
      .select("date, habits(title)")
      .gte("date", since),
    supabase
      .from("tasks")
      .select("title, completed_at")
      .eq("status", "done")
      .gte("completed_at", since),
    supabase
      .from("diary_entries")
      .select("date, evening_entry")
      .gte("date", since)
      .not("evening_entry", "is", null),
  ]);

  const checkins = checkinsRes.data ?? [];
  const tasksDone = tasksRes.data ?? [];
  const diaryEntries = diaryRes.data ?? [];

  const totalSignal = checkins.length + tasksDone.length + diaryEntries.length;

  if (totalSignal === 0) {
    return NextResponse.json({
      reflection: null,
      habitCompletions: 0,
      tasksCompleted: 0,
    });
  }

  const summary = [
    `Habit check-ins in the last 7 days: ${JSON.stringify(checkins)}`,
    `Tasks completed: ${JSON.stringify(tasksDone.map((t) => t.title))}`,
    `Diary entries: ${JSON.stringify(diaryEntries.map((d) => ({ date: d.date, text: d.evening_entry })))}`,
  ].join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: PROGRESS_SYSTEM_PROMPT,
    messages: [{ role: "user", content: summary }],
  });

  const textBlock = message.content.find((block) => block.type === "text");

  return NextResponse.json({
    reflection: textBlock?.text ?? null,
    habitCompletions: checkins.length,
    tasksCompleted: tasksDone.length,
  });
}
