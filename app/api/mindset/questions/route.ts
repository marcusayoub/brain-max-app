import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { REFRAME_SYSTEM_PROMPT, REFRAME_TOOL } from "@/lib/prompts/reframe";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { situation } = await request.json();
  if (typeof situation !== "string" || !situation.trim()) {
    return NextResponse.json({ error: "Missing situation" }, { status: 400 });
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: REFRAME_SYSTEM_PROMPT,
    tools: [REFRAME_TOOL],
    tool_choice: { type: "tool", name: "surface_questions" },
    messages: [{ role: "user", content: situation }],
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  const result = toolUse?.input as { questions?: string[] };

  return NextResponse.json({ questions: result?.questions ?? [] });
}
