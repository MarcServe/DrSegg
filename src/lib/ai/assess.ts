import type { SupabaseClient } from "@supabase/supabase-js";
import { callClaudeAssessmentText, callClaudeAssessmentVision } from "./claude";
import { callOpenAiAssessmentText, callOpenAiAssessmentVision } from "./openai";
import { applySafetyRules, confidenceBand, detectDeterministicRedFlags } from "./safety";
import { matchConditions } from "./knowledge-match";
import { ruleBasedAssessment } from "./rules";
import { fetchTreatmentsForCondition, type TreatmentRow } from "./treatments";
import { pickConditionCodeForTreatment } from "./treatment-condition";
import type { KnowledgeMatch, LlmAssessmentJson } from "./schemas";
import { normalizeLlmAssessment } from "./schemas";

export type CaseAssessmentResult = {
  model_used: string;
  assessment: LlmAssessmentJson;
  knowledge_matches: KnowledgeMatch[];
  treatments: TreatmentRow[];
  top_condition_code: string | null;
  disclaimer: string;
};

const DISCLAIMER =
  "This is a Dr Morgees–assisted triage summary, not a diagnosis. Always consult a qualified veterinarian for examination, testing, and treatment decisions.";

function fallbackEnabled(): boolean {
  return process.env.AI_FALLBACK_ENABLED !== "false";
}

async function fetchImageBase64(url: string): Promise<{ base64: string; mediaType: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "image/jpeg";
    const mediaType = ct.startsWith("image/") ? ct : "image/jpeg";
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    return { base64, mediaType };
  } catch {
    return null;
  }
}

/** Same rules as `/api/treatment` — best KB alignment, heat stress not over first LLM row. */
function pickTopConditionCode(
  knowledge: KnowledgeMatch[],
  assessment: LlmAssessmentJson
): string | null {
  return pickConditionCodeForTreatment(
    knowledge,
    assessment.differential_diagnoses?.[0]?.condition ?? null,
    assessment.differential_diagnoses ?? null
  );
}

export async function runCaseAssessment(
  supabase: SupabaseClient,
  args: {
    animal: string;
    symptoms: string[];
    region: string;
    visionUrls: string[];
    followupContext?: string | null;
  }
): Promise<CaseAssessmentResult> {
  const knowledge_matches = await matchConditions(supabase, args.animal, args.symptoms, args.region);
  const deterministic = detectDeterministicRedFlags(args.symptoms);
  const hasImage = args.visionUrls.length > 0;

  let model_used = "rules";
  let raw: LlmAssessmentJson | null = null;

  const tryVision = async (url: string) => {
    const oai = await callOpenAiAssessmentVision({
      animal: args.animal,
      symptoms: args.symptoms,
      region: args.region,
      imageUrl: url,
      knowledgeMatches: knowledge_matches,
      followupContext: args.followupContext,
    });
    if (oai.ok) {
      model_used = "openai/gpt-4o-mini";
      raw = oai.data;
      return true;
    }
    if (fallbackEnabled()) {
      const img = await fetchImageBase64(url);
      if (img) {
        const cl = await callClaudeAssessmentVision({
          animal: args.animal,
          symptoms: args.symptoms,
          region: args.region,
          imageBase64: img.base64,
          mediaType: img.mediaType,
          knowledgeMatches: knowledge_matches,
          followupContext: args.followupContext,
        });
        if (cl.ok) {
          model_used = "anthropic/claude";
          raw = cl.data;
          return true;
        }
      }
    }
    return false;
  };

  if (hasImage) {
    await tryVision(args.visionUrls[0]);
  }

  if (!raw) {
    const oaiText = await callOpenAiAssessmentText({
      animal: args.animal,
      symptoms: args.symptoms,
      region: args.region,
      knowledgeMatches: knowledge_matches,
      followupContext: args.followupContext,
    });
    if (oaiText.ok) {
      model_used = "openai/gpt-4o-mini";
      raw = oaiText.data;
    } else if (fallbackEnabled()) {
      const clText = await callClaudeAssessmentText({
        animal: args.animal,
        symptoms: args.symptoms,
        region: args.region,
        knowledgeMatches: knowledge_matches,
        followupContext: args.followupContext,
      });
      if (clText.ok) {
        model_used = "anthropic/claude";
        raw = clText.data;
      }
    }
  }

  if (!raw) {
    raw = ruleBasedAssessment(args.animal, args.symptoms);
    model_used = "rules";
  }

  raw = normalizeLlmAssessment(raw);

  let assessment = applySafetyRules(raw, deterministic, hasImage, args.symptoms.length);

  const top_condition_code = pickTopConditionCode(knowledge_matches, assessment);

  let treatments: TreatmentRow[] = [];
  const band = confidenceBand(assessment.confidence);
  const allowDrugs =
    band === "likely" &&
    !assessment.needs_more_info &&
    assessment.recommendation_type !== "emergency" &&
    assessment.recommendation_type !== "pending_more_info" &&
    assessment.health_status !== "healthy";

  if (allowDrugs && top_condition_code) {
    treatments = await fetchTreatmentsForCondition(supabase, {
      conditionCode: top_condition_code,
      species: args.animal,
      region: args.region,
    });
  }

  return {
    model_used,
    assessment,
    knowledge_matches,
    treatments,
    top_condition_code,
    disclaimer: DISCLAIMER,
  };
}
