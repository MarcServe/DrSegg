import { z } from "zod";

export const DifferentialDiagnosisSchema = z.object({
  condition: z.string(),
  confidence: z.number().min(0).max(1),
});

/** Raw JSON expected from OpenAI / Claude (flexible fields, then normalized) */
export const LlmAssessmentJsonSchema = z.object({
  summary: z.string(),
  health_status: z.enum(["healthy", "mild_concern", "likely_sick", "critical"]),
  confidence: z.number().min(0).max(100),
  possible_conditions: z.array(z.string()),
  differential_diagnoses: z.array(DifferentialDiagnosisSchema).optional().default([]),
  severity: z.string(),
  supporting_evidence: z.array(z.string()).optional().default([]),
  missing_information: z.array(z.string()).optional().default([]),
  red_flags: z.array(z.string()).optional().default([]),
  needs_more_info: z.boolean().optional(),
  suggested_next_checks: z.array(z.string()).optional().default([]),
  recommendation_type: z
    .enum(["monitor", "isolate", "urgent_vet", "emergency", "pending_more_info"])
    .optional(),
});

export type LlmAssessmentJson = z.infer<typeof LlmAssessmentJsonSchema>;

export type KnowledgeMatch = {
  condition_code: string;
  condition_name: string;
  score: number;
  chunk_excerpt?: string | null;
};

/** Some models return differential confidence as 0–100 instead of 0–1. */
export function normalizeLlmAssessment(data: LlmAssessmentJson): LlmAssessmentJson {
  return {
    ...data,
    differential_diagnoses: (data.differential_diagnoses ?? []).map((d) => ({
      condition: d.condition,
      confidence: d.confidence > 1 ? Math.min(d.confidence / 100, 1) : d.confidence,
    })),
  };
}
