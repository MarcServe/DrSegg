import type { LlmAssessmentJson } from "./schemas";

/** Deterministic baseline when LLMs are unavailable or as merge anchor. */
export function ruleBasedAssessment(
  animal: string,
  symptoms: string[]
): LlmAssessmentJson {
  const lower = symptoms.map((s) => s.toLowerCase());
  const hasCriticalSigns =
    lower.some((s) => s.includes("cannot stand")) ||
    lower.some((s) => s.includes("bleeding"));
  const hasWeakSignals = lower.some((s) => s.includes("lethargy"));

  if (hasCriticalSigns) {
    return {
      summary: "Severe signs reported; urgent veterinary assessment recommended.",
      health_status: "critical",
      confidence: 95,
      possible_conditions: ["Severe trauma or acute illness (unspecified)"],
      differential_diagnoses: [
        { condition: "Acute severe process", confidence: 0.5 },
      ],
      severity: "RED (CRITICAL)",
      supporting_evidence: symptoms,
      missing_information: ["Hands-on veterinary examination"],
      red_flags: ["Possible emergency signs reported"],
      needs_more_info: false,
      suggested_next_checks: ["Contact veterinarian immediately"],
      recommendation_type: "emergency",
    };
  }
  if (hasWeakSignals) {
    return {
      summary: "Mild non-specific signs; monitor closely and gather more detail.",
      health_status: "mild_concern",
      confidence: 55,
      possible_conditions: ["Early stress or mild illness"],
      differential_diagnoses: [{ condition: "Non-specific stress", confidence: 0.35 }],
      severity: "YELLOW (MONITOR)",
      supporting_evidence: symptoms,
      missing_information: ["Duration", "progression", "appetite/water intake"],
      red_flags: [],
      needs_more_info: true,
      suggested_next_checks: ["Note any progression over 24–48 hours"],
      recommendation_type: "pending_more_info",
    };
  }
  if (symptoms.length > 0) {
    const speciesLine =
      animal === "poultry"
        ? "Newcastle disease (differential)"
        : animal === "goat"
          ? "Peste des petits ruminants (differential)"
          : animal === "dog"
            ? "Canine parvovirus (differential)"
            : "Swine erysipelas (differential)";
    return {
      summary: `Reported signs for ${animal}; differential diagnosis requires more context.`,
      health_status: "likely_sick",
      confidence: 45,
      possible_conditions: [speciesLine],
      differential_diagnoses: [{ condition: speciesLine.replace(" (differential)", ""), confidence: 0.42 }],
      severity: animal === "poultry" ? "RED (CRITICAL)" : "ORANGE (HIGH)",
      supporting_evidence: symptoms,
      missing_information: ["Clinical exam findings", "flock/herd size affected", "timeline"],
      red_flags: [],
      needs_more_info: true,
      suggested_next_checks: ["Photos or video", "counts affected", "recent feed/water changes"],
      recommendation_type: "pending_more_info",
    };
  }

  return {
    summary: "No specific signs listed; routine observation suggested.",
    health_status: "healthy",
    confidence: 60,
    possible_conditions: [],
    differential_diagnoses: [],
    severity: "low",
    supporting_evidence: [],
    missing_information: [],
    red_flags: [],
    needs_more_info: true,
    suggested_next_checks: ["Add observations if any develop"],
    recommendation_type: "monitor",
  };
}
