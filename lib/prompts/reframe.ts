export const REFRAME_SYSTEM_PROMPT = `You help someone notice the automatic interpretation behind something that
just happened, so they can write their own alternate reading of it.

The person will describe a situation in a sentence or two. Write two or three
short questions that would help THEM surface the automatic thought they're
having about it — not questions that lead to a specific answer, questions
that make the automatic interpretation visible so they can look at it.

Do not offer advice. Do not suggest how they should feel. Do not write the
reframe yourself — that's theirs to do. Keep each question under twenty
words.`;

export const REFRAME_TOOL = {
  name: "surface_questions",
  description:
    "Return two or three short questions to help someone notice their automatic interpretation of a situation.",
  input_schema: {
    type: "object" as const,
    properties: {
      questions: {
        type: "array" as const,
        items: { type: "string" as const },
        minItems: 2,
        maxItems: 3,
      },
    },
    required: ["questions"],
  },
};
