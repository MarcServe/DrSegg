/**
 * Pick which knowledge condition drives structured treatments.
 * Aligns LLM differentials to the knowledge base, but does not let a first-listed diagnosis
 * (often "Heat stress") override clearly stronger retrieval when scores disagree.
 */

export const HEAT_STRESS_CODE = "heat_stress";

export type KnowledgeMatchLite = {
  condition_code?: string;
  condition_name?: string;
  score?: number;
};

/** Prefer higher retrieval scores when multiple condition names could match the same label. */
function matchNameInList(list: KnowledgeMatchLite[], label: string): string | null {
  const raw = label.trim();
  if (!raw) return null;
  const ll = raw.toLowerCase();

  if (raw.includes("_")) {
    const exact = list.find((k) => k.condition_code === raw);
    if (exact?.condition_code) return exact.condition_code;
  }

  const sorted = [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  for (const k of sorted) {
    const name = k.condition_name?.toLowerCase() ?? "";
    const code = (k.condition_code ?? "").toLowerCase();
    if (!name && !code) continue;
    if (name && (ll === name || ll.includes(name))) {
      return k.condition_code ?? null;
    }
    if (code && (ll.includes(code.replace(/_/g, " ")) || ll === code.replace(/_/g, " "))) {
      return k.condition_code ?? null;
    }
    if (name && name.includes(ll) && ll.length >= 4) {
      return k.condition_code ?? null;
    }
    const underscored = ll.replace(/\s+/g, "_");
    if (code && underscored === code) {
      return k.condition_code ?? null;
    }
  }
  return null;
}

/**
 * Prefer differential labels that map to the KB, choosing the mapping with **highest retrieval
 * score** (not first row in the LLM list). Refuse heat stress when retrieval points elsewhere.
 */
export function pickConditionCodeForTreatment(
  knowledgeMatches: KnowledgeMatchLite[] | null | undefined,
  likelyCondition: string | null | undefined,
  differentialDiagnoses?: { condition?: string }[] | null
): string | null {
  const list = (Array.isArray(knowledgeMatches) ? knowledgeMatches : []).filter(
    (k) => typeof k?.condition_code === "string" && k.condition_code.length > 0
  );
  if (list.length === 0) return null;

  const sorted = [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const scoreByCode = new Map(list.map((k) => [k.condition_code, k.score ?? 0]));
  const top = sorted[0];
  const topCode = top?.condition_code ?? null;
  const topScore = top?.score ?? 0;
  const heatScore = scoreByCode.get(HEAT_STRESS_CODE) ?? 0;

  const diffMapped: { code: string; score: number }[] = [];
  if (Array.isArray(differentialDiagnoses)) {
    for (const d of differentialDiagnoses) {
      const label = typeof d?.condition === "string" ? d.condition.trim() : "";
      if (!label) continue;
      const code = matchNameInList(list, label);
      if (code) {
        diffMapped.push({ code, score: scoreByCode.get(code) ?? 0 });
      }
    }
  }
  diffMapped.sort((a, b) => b.score - a.score);

  let chosen: string | null = diffMapped.length > 0 ? diffMapped[0].code : null;

  if (
    chosen === HEAT_STRESS_CODE &&
    topCode &&
    topCode !== HEAT_STRESS_CODE &&
    topScore > heatScore + 0.015
  ) {
    chosen = topCode;
  }

  if (chosen) return chosen;

  const likely = likelyCondition?.trim();
  if (likely) {
    const fromLikely = matchNameInList(list, likely);
    if (fromLikely) {
      if (
        fromLikely === HEAT_STRESS_CODE &&
        topCode &&
        topCode !== HEAT_STRESS_CODE &&
        topScore > heatScore + 0.015
      ) {
        return topCode;
      }
      return fromLikely;
    }
  }

  return sorted[0]?.condition_code ?? null;
}
