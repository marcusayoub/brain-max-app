import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  SPECIFICITY_SYSTEM_PROMPT,
  SPECIFICITY_TOOL,
} from "@/lib/prompts/specificity";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { statement } = await request.json();
  if (typeof statement !== "string" || !statement.trim()) {
    return NextResponse.json({ error: "Missing statement" }, { status: 400 });
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: SPECIFICITY_SYSTEM_PROMPT,
    tools: [SPECIFICITY_TOOL],
    tool_choice: { type: "tool", name: "evaluate_specificity" },
    messages: [{ role: "user", content: statement }],
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  const result = toolUse?.input as { vague: boolean; question?: string };

  return NextResponse.json({
    vague: result?.vague ?? false,
    question: result?.question ?? null,
  });
}
