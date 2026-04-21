import { LlmAssessmentJsonSchema, type LlmAssessmentJson } from "./schemas";
import type { KnowledgeMatch } from "./schemas";
import { ASSESSMENT_SYSTEM_PROMPT, buildAssessmentUserMessage } from "./assessment-prompt";

function parseJsonContent(raw: string): LlmAssessmentJson | null {
  try {
    const parsed = JSON.parse(raw.trim()) as unknown;
    const r = LlmAssessmentJsonSchema.safeParse(parsed);
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

export async function callClaudeAssessmentText(args: {
  animal: string;
  symptoms: string[];
  region: string;
  knowledgeMatches: KnowledgeMatch[];
  followupContext?: string | null;
}): Promise<{ ok: true; data: LlmAssessmentJson } | { ok: false; error: string }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, error: "ANTHROPIC_API_KEY missing" };

  const userContent = buildAssessmentUserMessage(
    args.animal,
    args.symptoms,
    args.region,
    args.knowledgeMatches,
    args.followupContext
  );

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      max_tokens: 1800,
      system: ASSESSMENT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `Anthropic HTTP ${res.status}` };
  }

  const json = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = json.content?.find((c) => c.type === "text")?.text;
  if (!text) return { ok: false, error: "Claude empty response" };

  const data = parseJsonContent(text);
  if (!data) return { ok: false, error: "Claude JSON parse failed" };
  return { ok: true, data };
}

export async function callClaudeAssessmentVision(args: {
  animal: string;
  symptoms: string[];
  region: string;
  imageBase64: string;
  mediaType: string;
  knowledgeMatches: KnowledgeMatch[];
  followupContext?: string | null;
}): Promise<{ ok: true; data: LlmAssessmentJson } | { ok: false; error: string }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, error: "ANTHROPIC_API_KEY missing" };

  const textPart = buildAssessmentUserMessage(
    args.animal,
    args.symptoms,
    args.region,
    args.knowledgeMatches,
    args.followupContext
  );

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      max_tokens: 1800,
      system: ASSESSMENT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: textPart },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: args.mediaType,
                data: args.imageBase64,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `Anthropic HTTP ${res.status}` };
  }

  const json = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = json.content?.find((c) => c.type === "text")?.text;
  if (!text) return { ok: false, error: "Claude empty vision response" };

  const data = parseJsonContent(text);
  if (!data) return { ok: false, error: "Claude JSON parse failed" };
  return { ok: true, data };
}
