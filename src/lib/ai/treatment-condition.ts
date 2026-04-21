/**
 * Pick which knowledge condition drives structured treatments.
 * Must stay aligned with assessment intent: prefer the likely diagnosis, then best-scoring match.
 * (Using only knowledge_matches[0] makes every case look like the same disease.)
 */

export type KnowledgeMatchLite = {
  condition_code?: string;
  condition_name?: string;
  score?: number;
};

function matchNameInList(list: KnowledgeMatchLite[], label: string): string | null {
  const raw = label.trim();
  if (!raw) return null;
  const ll = raw.toLowerCase();
  if (raw.includes("_")) {
    const exact = list.find((k) => k.condition_code === raw);
    if (exact?.condition_code) return exact.condition_code;
  }
  const byName = list.find((k) => {
    const name = k.condition_name?.toLowerCase() ?? "";
    if (!name) return false;
    return (
      ll === name ||
      ll.includes(name) ||
      name.includes(ll) ||
      ll.replace(/\s+/g, "_") === (k.condition_code ?? "").toLowerCase()
    );
  });
  return byName?.condition_code ?? null;
}

/**
 * @param differentialTop - first entry from assessment.differential_diagnoses (same role as pickTopConditionCode in assess.ts)
 */
export function pickConditionCodeForTreatment(
  knowledgeMatches: KnowledgeMatchLite[] | null | undefined,
  likelyCondition: string | null | undefined,
  differentialTop?: string | null
): string | null {
  const list = (Array.isArray(knowledgeMatches) ? knowledgeMatches : []).filter(
    (k) => typeof k?.condition_code === "string" && k.condition_code.length > 0
  );
  if (list.length === 0) return null;

  const likely = likelyCondition?.trim();
  if (likely) {
    const fromLikely = matchNameInList(list, likely);
    if (fromLikely) return fromLikely;
  }

  const diff = differentialTop?.trim();
  if (diff) {
    const fromDiff = matchNameInList(list, diff);
    if (fromDiff) return fromDiff;
  }

  const sorted = [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return sorted[0]?.condition_code ?? null;
}
