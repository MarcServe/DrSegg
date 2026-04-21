import { LlmAssessmentJsonSchema, type LlmAssessmentJson } from "./schemas";
import type { KnowledgeMatch } from "./schemas";
import { ASSESSMENT_SYSTEM_PROMPT, buildAssessmentUserMessage } from "./assessment-prompt";

function parseJsonContent(raw: string): LlmAssessmentJson | null {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const r = LlmAssessmentJsonSchema.safeParse(parsed);
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

export async function callOpenAiAssessmentText(args: {
  animal: string;
  symptoms: string[];
  region: string;
  knowledgeMatches: KnowledgeMatch[];
  followupContext?: string | null;
}): Promise<{ ok: true; data: LlmAssessmentJson } | { ok: false; error: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, error: "OPENAI_API_KEY missing" };

  const userContent = buildAssessmentUserMessage(
    args.animal,
    args.symptoms,
    args.region,
    args.knowledgeMatches,
    args.followupContext
  );

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: ASSESSMENT_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      max_tokens: 1800,
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `OpenAI HTTP ${res.status}` };
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) return { ok: false, error: "OpenAI empty response" };

  const data = parseJsonContent(raw);
  if (!data) return { ok: false, error: "OpenAI JSON parse failed" };
  return { ok: true, data };
}

export async function callOpenAiAssessmentVision(args: {
  animal: string;
  symptoms: string[];
  region: string;
  imageUrl: string;
  knowledgeMatches: KnowledgeMatch[];
  followupContext?: string | null;
}): Promise<{ ok: true; data: LlmAssessmentJson } | { ok: false; error: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, error: "OPENAI_API_KEY missing" };

  const text = buildAssessmentUserMessage(
    args.animal,
    args.symptoms,
    args.region,
    args.knowledgeMatches,
    args.followupContext
  );

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: ASSESSMENT_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text },
            { type: "image_url", image_url: { url: args.imageUrl } },
          ],
        },
      ],
      max_tokens: 1800,
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `OpenAI HTTP ${res.status}` };
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) return { ok: false, error: "OpenAI empty response" };

  const data = parseJsonContent(raw);
  if (!data) return { ok: false, error: "OpenAI JSON parse failed" };
  return { ok: true, data };
}
