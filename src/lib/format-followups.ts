/** Format stored follow-ups for LLM assessment prompts (chronological). */
export function formatFollowupsForPrompt(
  rows: { created_at: string; notes: string | null; status: string | null }[]
): string {
  if (!rows?.length) return "";
  return rows
    .map((r, i) => {
      const d = new Date(r.created_at).toISOString().slice(0, 16).replace("T", " ");
      const st = r.status || "noted";
      const n = (r.notes || "").trim() || "(no notes)";
      return `${i + 1}. [${d}] status=${st}: ${n}`;
    })
    .join("\n");
}
