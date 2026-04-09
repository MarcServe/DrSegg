import { LlmAssessmentJsonSchema, type LlmAssessmentJson } from "./schemas";
import type { KnowledgeMatch } from "./schemas";

const SYSTEM = `You are a clinical triage assistant for farm and companion animal health. You are NOT a veterinarian and do not replace one.

Rules:
- Output a single JSON object only, no markdown.
- Never invent specific drug names, doses, or prescriptions. Use general terms like "seek veterinary advice" for medication decisions.
- Prefer cautious language. Include differentials with confidence between 0 and 1.
- Flag uncertainty with needs_more_info when appropriate.
- Species and region may affect disease likelihood; stay conservative.`;

function buildUserPrompt(
  animal: string,
  symptoms: string[],
  region: string,
  knowledgeLines: KnowledgeMatch[]
): string {
  const kb =
    knowledgeLines.length > 0
      ? `\nKnowledge base candidates (for grounding only; you may adjust if evidence conflicts):\n${knowledgeLines
          .map((k) => `- ${k.condition_name} (${k.condition_code}): score ${k.score.toFixed(2)}`)
          .join("\n")}\n`
      : "";
  return `${SYSTEM}

Animal species: ${animal}
Region context: ${region}
Reported signs / symptoms: ${symptoms.length ? symptoms.join("; ") : "none listed"}
${kb}
Return JSON with keys:
summary (string),
health_status (healthy | mild_concern | likely_sick | critical),
confidence (0-100 number),
possible_conditions (string array, short labels),
differential_diagnoses (array of {condition: string, confidence: 0-1}),
severity (one of: low, YELLOW (MONITOR), ORANGE (HIGH), RED (CRITICAL)),
supporting_evidence (string array),
missing_information (string array),
red_flags (string array),
needs_more_info (boolean),
suggested_next_checks (string array),
recommendation_type (monitor | isolate | urgent_vet | emergency | pending_more_info)`;
}

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
}): Promise<{ ok: true; data: LlmAssessmentJson } | { ok: false; error: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, error: "OPENAI_API_KEY missing" };

  const prompt = buildUserPrompt(args.animal, args.symptoms, args.region, args.knowledgeMatches);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1200,
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
}): Promise<{ ok: true; data: LlmAssessmentJson } | { ok: false; error: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, error: "OPENAI_API_KEY missing" };

  const text = buildUserPrompt(args.animal, args.symptoms, args.region, args.knowledgeMatches);

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
        {
          role: "user",
          content: [
            { type: "text", text },
            { type: "image_url", image_url: { url: args.imageUrl } },
          ],
        },
      ],
      max_tokens: 1200,
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
