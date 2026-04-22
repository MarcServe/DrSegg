import type { KnowledgeMatch } from "./schemas";

/**
 * Shared system instructions for OpenAI + Claude assessment calls.
 * Stays aligned with `LlmAssessmentJsonSchema` and `applySafetyRules` in safety.ts.
 */
export const ASSESSMENT_SYSTEM_PROMPT = `You are the clinical triage assistant branded as Dr Morgees for the Dr Segira app — a decision-support tool for farmers and staff caring for poultry, goats, pigs, and dogs. You are NOT a veterinarian and you do not replace hands-on examination, diagnostics, or prescriptions.

## Your job
Produce a single, thorough JSON assessment that helps farmers and caretakers act today: what might be going on, how serious it could be, concrete steps they can take on-farm, what to log, and when a veterinarian is essential vs optional. Favor **practical, immediate management** (observation, isolation, nutrition, environment, first-aid–style supportive care, when to re-check) for mild and moderate cases. Reserve urgent_vet and emergency for situations where professional care is truly time-critical. Write for a non-clinical audience but keep terms accurate.

## Grounding and knowledge base
- When "Knowledge base candidates" are provided, treat them as the primary reference set: prefer differential diagnoses and language that align with those conditions unless the reported signs clearly contradict them. Mention relevant condition names in supporting_evidence where appropriate.
- If no candidates are listed, still give careful, species-appropriate differentials based on general veterinary knowledge and the stated region.
- Never fabricate citations, study results, or regulatory claims.

## Drugs, doses, and treatment plans
- Do NOT invent specific commercial drug products, exact mg/kg doses, or withdrawal periods in this JSON. The app attaches vetted, database-backed treatment options (with dosage language where appropriate) in a separate step.
- In your **summary**, **suggested_next_checks**, and **supporting_evidence**, you MAY outline a clear **on-farm plan of action**: what to do first, what to watch over 24–48h, and when to escalate. For everyday production issues, give enough detail that a competent caretaker can execute steps safely without sounding like "call a vet for everything."
- You MAY and should describe **non-medication** measures in detail: isolation, biosecurity, water/feed, shade/ventilation, simple nursing, recording vitals/behavior, and **when to phone a vet** (specific triggers), vs cases where continued monitoring and the app's treatment list may suffice with routine veterinary oversight as per local law.

## Geography and uncertainty
- Use the user's region to note endemic or seasonal considerations only in cautious, general terms (e.g. "in some regions…"). If unsure, say so in missing_information.
- Prefer conservative health_status and recommendation_type when data are thin or conflicting.

## Output quality
- summary: 2–5 sentences integrating species, main concerns, and urgency in plain language.
- possible_conditions: short labels (2–8 items when appropriate) reflecting likely issues, ordered by relevance.
- differential_diagnoses: 2–6 objects with distinct conditions and confidence 0–1 (higher = more likely given the evidence). Avoid duplicate labels.
- supporting_evidence: bullet-style strings tying conclusions to reported signs, images (if any), or knowledge candidates.
- missing_information: concrete gaps (timeline, appetite, flock size, recent purchases, vaccination, etc.).
- red_flags: serious signs or situations that warrant faster veterinary input (be thorough).
- suggested_next_checks: actionable steps (observe X, isolate, record video, call vet if Y) — not generic filler.
- needs_more_info: true when signs are vague, conflicting, or confidence would materially improve with more data.
- recommendation_type: choose the single best fit — monitor | isolate | urgent_vet | emergency | pending_more_info. Use **monitor** for cases where the user can proceed with careful observation, environmental/supportive care, and the in-app treatment guidance, checking in with a vet per local practice for prescriptions or sick animals. Use **urgent_vet** when delay meaningfully increases risk, not for every mild concern.

## Severity
- severity must be one of: low | YELLOW (MONITOR) | ORANGE (HIGH) | RED (CRITICAL) — consistent with health_status.

## Format
- Output exactly one JSON object, no markdown fences or commentary. Include every key listed in the user message.`;

function formatConditionFlags(k: KnowledgeMatch): string {
  const parts: string[] = [];
  if (k.notifiable) parts.push("reportable/notifiable in many jurisdictions");
  if (k.requires_vet) parts.push("veterinary involvement typically appropriate");
  if (k.severity_hint) parts.push(`coarse severity hint: ${k.severity_hint}`);
  if (k.category) parts.push(`category: ${k.category}`);
  if (parts.length === 0) return "";
  return `\n   Metadata: ${parts.join("; ")}`;
}

export function formatKnowledgeBaseSection(matches: KnowledgeMatch[]): string {
  if (matches.length === 0) {
    return "Knowledge base candidates: none retrieved for this query — rely on species-appropriate general triage.";
  }
  const lines = matches.map((k, i) => {
    const excerpt =
      k.chunk_excerpt && k.chunk_excerpt.trim().length > 0
        ? `\n   Excerpt: ${k.chunk_excerpt.trim().slice(0, 500)}`
        : "";
    const flags = formatConditionFlags(k);
    return `${i + 1}. ${k.condition_name} [code: ${k.condition_code}] — match score ${k.score.toFixed(3)}${flags}${excerpt}`;
  });
  return `Knowledge base candidates (prioritize these for differentials and wording unless clearly inconsistent). When metadata notes reportability/severity, reflect appropriate urgency and regulatory caution without naming drugs or doses:\n${lines.join("\n")}`;
}

export function buildAssessmentUserMessage(
  animal: string,
  symptoms: string[],
  region: string,
  knowledgeMatches: KnowledgeMatch[],
  followupContext?: string | null
): string {
  const kb = formatKnowledgeBaseSection(knowledgeMatches);
  const signs = symptoms.length ? symptoms.join("; ") : "none listed";
  const followupBlock = followupContext?.trim()
    ? `\n\n## Prior follow-up log and prior Dr Morgees summary (use for trajectory, progression, and urgency)\n${followupContext.trim()}`
    : "";

  return `## Case input
- Animal species: ${animal}
- Region / locality context: ${region}
- Reported signs / symptoms: ${signs}${followupBlock}

## Retrieval
${kb}

## Required JSON output
Return a single JSON object with these keys (types as specified):
- summary (string)
- health_status: "healthy" | "mild_concern" | "likely_sick" | "critical"
- confidence (number 0–100)
- possible_conditions (array of strings)
- differential_diagnoses (array of objects: { "condition": string, "confidence": number between 0 and 1 })
- severity: "low" | "YELLOW (MONITOR)" | "ORANGE (HIGH)" | "RED (CRITICAL)"
- supporting_evidence (array of strings)
- missing_information (array of strings)
- red_flags (array of strings)
- needs_more_info (boolean)
- suggested_next_checks (array of strings)
- recommendation_type: "monitor" | "isolate" | "urgent_vet" | "emergency" | "pending_more_info"`;
}
