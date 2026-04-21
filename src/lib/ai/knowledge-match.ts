import type { SupabaseClient } from "@supabase/supabase-js";
import type { KnowledgeMatch } from "./schemas";
import { embedText } from "./embeddings";

type ConditionRow = {
  id: string;
  condition_code: string;
  condition_name: string;
  species: string[] | null;
  common_symptoms: string[] | null;
  requires_vet?: boolean | null;
  notifiable?: boolean | null;
  severity_hint?: string | null;
  category?: string | null;
};

type ChunkRow = {
  condition_id: string;
  chunk_text: string;
  embedding: string | null;
};

function speciesMatches(row: ConditionRow, animal: string): boolean {
  const sp = row.species ?? [];
  if (sp.length === 0) return true;
  const a = animal.toLowerCase();
  return sp.some((s) => s.toLowerCase() === a || s.toLowerCase() === "all");
}

function keywordScore(condition: ConditionRow, chunks: ChunkRow[], symptoms: string[]): number {
  const tokens = symptoms
    .join(" ")
    .toLowerCase()
    .split(/[\s,;.]+/)
    .filter((t) => t.length > 2);
  if (tokens.length === 0) return 0;

  let hits = 0;
  const hay = [
    condition.condition_name.toLowerCase(),
    ...(condition.common_symptoms ?? []).map((s) => s.toLowerCase()),
    ...chunks.filter((c) => c.condition_id === condition.id).map((c) => c.chunk_text.toLowerCase()),
  ].join(" ");

  for (const t of tokens) {
    if (hay.includes(t)) hits += 1;
  }

  return hits / Math.max(tokens.length, 1);
}

const HEAT_STRESS_CODE = "heat_stress";

/** Without heat-related cues, environmental heat stress often false-wins retrieval (broad species + vague wording). */
function symptomTextSuggestsHeatStress(symptoms: string[]): boolean {
  const s = symptoms.join(" ").toLowerCase();
  return /\b(heat|hot|hypertherm|pant|panting|shade|ventilation|ventilate|cooling|cool water|summer|sun|temperature|humid|drought|midday|afternoon|overheat|dehydrat|heat.?stress|thirst)\b/i.test(
    s
  );
}

function applyHeatStressDemotion(
  matches: KnowledgeMatch[],
  symptoms: string[]
): KnowledgeMatch[] {
  if (symptomTextSuggestsHeatStress(symptoms)) return matches;
  return matches.map((m) => {
    if (m.condition_code !== HEAT_STRESS_CODE) return m;
    const s = Math.max(0, (m.score ?? 0) * 0.2 - 0.05);
    return { ...m, score: s };
  });
}

/**
 * Hybrid retrieval: keyword scoring + optional pgvector similarity when embeddings exist.
 */
export async function matchConditions(
  supabase: SupabaseClient,
  animal: string,
  symptoms: string[],
  _region: string
): Promise<KnowledgeMatch[]> {
  try {
  const { data: conditions, error: cErr } = await supabase
    .from("knowledge_conditions")
    .select(
      "id, condition_code, condition_name, species, common_symptoms, requires_vet, notifiable, severity_hint, category"
    );

  if (cErr || !conditions?.length) {
    return [];
  }

  const filtered = (conditions as ConditionRow[]).filter((c) => speciesMatches(c, animal));
  if (filtered.length === 0) return [];

  const { data: chunks } = await supabase
    .from("knowledge_condition_chunks")
    .select("condition_id, chunk_text, embedding");

  const chunkRows = (chunks ?? []) as ChunkRow[];

  let scored: KnowledgeMatch[] = filtered.map((c) => ({
    condition_code: c.condition_code,
    condition_name: c.condition_name,
    score: keywordScore(c, chunkRows, symptoms),
    chunk_excerpt: chunkRows.find((ch) => ch.condition_id === c.id)?.chunk_text?.slice(0, 200) ?? null,
    requires_vet: c.requires_vet ?? null,
    notifiable: c.notifiable ?? null,
    severity_hint: c.severity_hint ?? null,
    category: c.category ?? null,
  }));

  const queryEmbedding = await embedText(symptoms.join(" ") || animal);
  if (queryEmbedding && chunkRows.some((ch) => ch.embedding)) {
    const { data: rpcRows, error: rpcErr } = await supabase.rpc("match_knowledge_chunks", {
      query_embedding: queryEmbedding,
      p_species: animal,
      match_count: 8,
    });

    if (!rpcErr && Array.isArray(rpcRows) && rpcRows.length > 0) {
      const bonus = new Map<string, number>();
      for (const row of rpcRows as { condition_code?: string; similarity?: number }[]) {
        const code = row.condition_code;
        if (code && typeof row.similarity === "number") {
          bonus.set(code, Math.max(bonus.get(code) ?? 0, row.similarity));
        }
      }
      scored = scored.map((m) => ({
        ...m,
        score: m.score + (bonus.get(m.condition_code) ?? 0) * 0.5,
      }));
    }
  }

  scored = applyHeatStressDemotion(scored, symptoms);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 8);
  } catch {
    return [];
  }
}
