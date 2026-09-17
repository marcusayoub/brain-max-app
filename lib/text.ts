export function deriveTitle(content: string): string {
  const firstLine =
    content
      .trim()
      .split("\n")
      .find((line) => line.trim().length > 0) ?? "";
  const sentenceMatch = firstLine.match(/^[^.!?]*[.!?]/);
  const raw = (sentenceMatch ? sentenceMatch[0] : firstLine).trim();
  return raw.length > 60 ? `${raw.slice(0, 57).trimEnd()}…` : raw;
}
