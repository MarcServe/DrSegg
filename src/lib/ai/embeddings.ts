/**
 * OpenAI text embeddings for optional vector retrieval (1536-dim text-embedding-3-small).
 */

const EMBEDDING_MODEL = "text-embedding-3-small";

export async function embedText(text: string): Promise<number[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !text.trim()) return null;

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000),
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: { embedding?: number[] }[];
  };
  return json.data?.[0]?.embedding ?? null;
}

/**
 * Batch embeddings (same model/dim as {@link embedText}). Order matches input order.
 * Use sparingly; each batch is one OpenAI request.
 */
export async function embedTexts(texts: string[]): Promise<(number[] | null)[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return texts.map(() => null);
  }
  if (texts.length === 0) return [];

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts.map((t) => t.slice(0, 8000)),
    }),
  });

  if (!res.ok) {
    return texts.map(() => null);
  }

  const json = (await res.json()) as {
    data?: { embedding: number[]; index: number }[];
  };
  const rows = json.data ?? [];
  const byIndex = new Map(rows.map((r) => [r.index, r.embedding]));
  return texts.map((_, i) => byIndex.get(i) ?? null);
}
