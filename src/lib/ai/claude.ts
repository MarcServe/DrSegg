import { LlmAssessmentJsonSchema, type LlmAssessmentJson } from "./schemas";
import type { KnowledgeMatch } from "./schemas";

function buildPrompt(
  animal: string,
  symptoms: string[],
  region: string,
  knowledgeMatches: KnowledgeMatch[]
): string {
  const kb =
    knowledgeMatches.length > 0
      ? `\nReference conditions (grounding):\n${knowledgeMatches
          .map((k) => `- ${k.condition_name} (${k.condition_code})`)
          .join("\n")}\n`
      : "";

  return `You are a farm/companion animal triage assistant — NOT a vet. Never prescribe specific drugs or doses.

Animal: ${animal}
Region: ${region}
Symptoms: ${symptoms.length ? symptoms.join("; ") : "none"}
${kb}
Respond with ONLY a JSON object (no markdown) using these keys:
summary, health_status (healthy|mild_concern|likely_sick|critical), confidence (0-100),
possible_conditions (array of strings),
differential_diagnoses (array of {condition, confidence 0-1}),
severity (low | YELLOW (MONITOR) | ORANGE (HIGH) | RED (CRITICAL)),
supporting_evidence, missing_information, red_flags (arrays of strings),
needs_more_info (boolean), suggested_next_checks (array of strings),
recommendation_type (monitor|isolate|urgent_vet|emergency|pending_more_info)`;
}

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
}): Promise<{ ok: true; data: LlmAssessmentJson } | { ok: false; error: string }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, error: "ANTHROPIC_API_KEY missing" };

  const prompt = buildPrompt(args.animal, args.symptoms, args.region, args.knowledgeMatches);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
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
}): Promise<{ ok: true; data: LlmAssessmentJson } | { ok: false; error: string }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, error: "ANTHROPIC_API_KEY missing" };

  const textPart = buildPrompt(args.animal, args.symptoms, args.region, args.knowledgeMatches);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      max_tokens: 1200,
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
