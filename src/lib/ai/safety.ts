import type { LlmAssessmentJson } from "./schemas";

const EMERGENCY_PATTERNS: { pattern: RegExp; message: string }[] = [
  { pattern: /\b(cannot stand|unable to stand|down\b|recumbent)\b/i, message: "Unable to stand / recumbency" },
  { pattern: /\b(seizure|convuls|twisting neck|torticollis)\b/i, message: "Neurological / seizure signs" },
  { pattern: /\b(severe bleed|hemorrhag|bloody diarr|blood in stool)\b/i, message: "Severe bleeding or bloody diarrhoea" },
  { pattern: /\b(cannot breathe|gasping|open.?mouth breath|severe respiratory)\b/i, message: "Severe respiratory distress" },
  { pattern: /\b(bloat|distended abdomen|acute abdomen)\b/i, message: "Abdominal distension / bloat concern" },
  { pattern: /\b(poison|toxin|ingest(ed)? toxin)\b/i, message: "Suspected poisoning / toxin" },
  { pattern: /\b(mass death|many died|high mortality|50%|half the flock)\b/i, message: "High mortality / mass losses" },
  { pattern: /\b(not drinking|unable to drink|won't drink)\b/i, message: "Not drinking" },
];

/**
 * Deterministic red flags from user-reported text (not a substitute for exam).
 */
export function detectDeterministicRedFlags(symptomTexts: string[]): string[] {
  const blob = symptomTexts.join(" ").toLowerCase();
  const out = new Set<string>();
  for (const { pattern, message } of EMERGENCY_PATTERNS) {
    if (pattern.test(blob)) out.add(message);
  }
  return [...out];
}

export function mergeRedFlags(model: string[], deterministic: string[]): string[] {
  return [...new Set([...deterministic, ...model])];
}

export type ConfidenceBand = "too_low" | "possible" | "likely";

export function confidenceBand(scorePercent: number): ConfidenceBand {
  if (scorePercent < 40) return "too_low";
  if (scorePercent < 70) return "possible";
  return "likely";
}

/**
 * Apply safety rules on top of model output. Model suggestions are constrained, not trusted alone.
 */
export function applySafetyRules(
  parsed: LlmAssessmentJson,
  deterministicRedFlags: string[],
  hasImage: boolean,
  symptomCount: number
): LlmAssessmentJson {
  const red = mergeRedFlags(parsed.red_flags ?? [], deterministicRedFlags);

  let health_status = parsed.health_status;
  let severity = parsed.severity;
  let recommendation_type = parsed.recommendation_type ?? "monitor";
  let needs_more_info = parsed.needs_more_info ?? false;
  const missing = [...(parsed.missing_information ?? [])];
  const suggested = [...(parsed.suggested_next_checks ?? [])];

  if (red.length > 0) {
    const emergency = red.some((r) =>
      /bleeding|respiratory|seizure|poison|mortality|bloat|Unable to stand|Neurological/i.test(r)
    );
    if (emergency) {
      health_status = "critical";
      severity = "RED (CRITICAL)";
      recommendation_type = "emergency";
      needs_more_info = false;
    } else {
      health_status = health_status === "healthy" ? "likely_sick" : health_status;
      recommendation_type = "urgent_vet";
    }
  }

  const band = confidenceBand(parsed.confidence);
  if (band === "too_low" && health_status !== "critical") {
    needs_more_info = true;
    if (recommendation_type === "monitor") recommendation_type = "pending_more_info";
    if (missing.length === 0) {
      missing.push("More specific signs and timeline");
    }
    if (!hasImage && suggested.length < 4) {
      suggested.push("Clear photo or short video of the affected animal(s)");
    }
    if (symptomCount < 2 && suggested.length < 5) {
      suggested.push("Additional observations (appetite, water intake, duration)");
    }
  }

  if (band === "possible" && recommendation_type === "monitor") {
    recommendation_type = "isolate";
  }

  return {
    ...parsed,
    health_status,
    severity,
    red_flags: red,
    missing_information: missing,
    suggested_next_checks: suggested,
    needs_more_info,
    recommendation_type,
  };
}
