/**
 * OpenAI text embeddings for optional vector retrieval (1536-dim text-embedding-3-small).
 */
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
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: { embedding?: number[] }[];
  };
  return json.data?.[0]?.embedding ?? null;
}
