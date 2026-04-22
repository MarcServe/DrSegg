import type { SupabaseClient } from "@supabase/supabase-js";
import type { CaseAssessmentResult } from "@/lib/ai/assess";

function mapCaseStatus(recommendationType: string | undefined): string {
  if (recommendationType === "emergency" || recommendationType === "urgent_vet") return "escalated";
  if (recommendationType === "pending_more_info") return "pending_more_info";
  return "open";
}

function healthStatusFromAssessment(h: string): "healthy" | "mild_concern" | "likely_sick" | "critical" {
  if (h === "healthy" || h === "mild_concern" || h === "likely_sick" || h === "critical") {
    return h;
  }
  return "likely_sick";
}

/** Shared inserts after runCaseAssessment — new case or reassessment of existing case. */
export async function persistCaseAssessmentArtifacts(
  supabase: SupabaseClient,
  params: {
    caseId: string;
    region: string;
    outcome: CaseAssessmentResult;
    symptoms: string[];
    storagePaths: string[];
    /** When true, update `cases` row; when false, caller already created the row (legacy — always true for our flows). */
    updateCaseRow: boolean;
  }
): Promise<{
  health_status: "healthy" | "mild_concern" | "likely_sick" | "critical";
  confidence: number;
  possible_conditions: string[];
  severity: string;
  requiresMoreData: boolean;
  caseStatus: string;
}> {
  const { outcome, caseId, region, symptoms, storagePaths, updateCaseRow } = params;
  const a = outcome.assessment;
  const health_status = healthStatusFromAssessment(a.health_status);
  const confidence = Math.round(a.confidence);
  const possible_conditions = a.possible_conditions;
  const severity = a.severity;
  const requiresMoreData = !!a.needs_more_info;
  const caseStatus = mapCaseStatus(a.recommendation_type);

  if (updateCaseRow) {
    const { error: upErr } = await supabase
      .from("cases")
      .update({
        health_status,
        confidence: confidence.toString(),
        mode: health_status === "healthy" ? "observation" : "diagnosis",
        status: caseStatus,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", caseId);
    if (upErr) throw upErr;
  }

  const rows: { case_id: string; type: string; transcription?: string; file_url?: string }[] = [];

  for (const sym of symptoms) {
    rows.push({ case_id: caseId, type: "text", transcription: sym });
  }
  storagePaths.forEach((p, i) => {
    const isVideo = /\.(mp4|webm|mov|mkv)$/i.test(p);
    rows.push({
      case_id: caseId,
      type: isVideo ? "video" : "image",
      file_url: p,
      transcription: isVideo ? `Video ${i + 1}` : `Image ${i + 1}`,
    });
  });

  if (rows.length > 0) {
    const { error: inputError } = await supabase.from("case_inputs").insert(rows);
    if (inputError) throw inputError;
  }

  const recommendationsList: string[] = [...a.suggested_next_checks, outcome.disclaimer];

  if (health_status !== "healthy") {
    const { error: analysisError } = await supabase.from("case_analysis").insert({
      case_id: caseId,
      possible_conditions,
      severity,
      recommendations: recommendationsList,
    });
    if (analysisError) throw analysisError;
  }

  const likely = a.differential_diagnoses?.[0]?.condition ?? possible_conditions[0] ?? null;

  const { error: aiErr } = await supabase.from("ai_assessments").insert({
    case_id: caseId,
    model_name: outcome.model_used,
    summary: a.summary,
    likely_condition: likely,
    differential_diagnoses: a.differential_diagnoses ?? [],
    confidence_score: confidence,
    severity,
    needs_more_info: a.needs_more_info ?? false,
    missing_info: a.missing_information ?? [],
    suggested_next_checks: a.suggested_next_checks ?? [],
    red_flags: a.red_flags ?? [],
    supporting_evidence: a.supporting_evidence ?? [],
    recommendation_type: a.recommendation_type ?? "monitor",
    knowledge_matches: outcome.knowledge_matches,
    treatments_snapshot: outcome.treatments,
    disclaimer: outcome.disclaimer,
  });
  if (aiErr) throw aiErr;

  const recRows: {
    case_id: string;
    recommendation_type: string;
    title: string;
    description: string;
    source_type: string;
    priority: number;
  }[] = [];

  let p = 1;
  for (const t of outcome.treatments) {
    recRows.push({
      case_id: caseId,
      recommendation_type: "drug",
      title: t.drug_name,
      description: [
        t.generic_name ? `Active: ${t.generic_name}` : "",
        t.dosage_text ?? "",
        t.supportive_care ?? "",
        t.prescription_required ? "Prescription may be required — follow local law and vet advice." : "",
      ]
        .filter(Boolean)
        .join(" "),
      source_type: "database",
      priority: p++,
    });
  }

  if (a.needs_more_info) {
    recRows.push({
      case_id: caseId,
      recommendation_type: "monitoring",
      title: "More information needed",
      description: (a.missing_information ?? []).join("; ") || "Add detail or media and re-run analysis.",
      source_type: "ai",
      priority: 0,
    });
  }

  if (a.recommendation_type === "emergency" || (a.red_flags?.length ?? 0) > 0) {
    recRows.push({
      case_id: caseId,
      recommendation_type: "escalation",
      title: "Seek veterinary care",
      description: "Escalate to a qualified veterinarian urgently based on signs or uncertainty.",
      source_type: "system",
      priority: -1,
    });
  }

  if (recRows.length > 0) {
    const { error: rErr } = await supabase.from("case_recommendations").insert(recRows);
    if (rErr) throw rErr;
  }

  if (caseStatus === "escalated") {
    const { data: existingVr } = await supabase
      .from("vet_reviews")
      .select("id")
      .eq("case_id", caseId)
      .limit(1)
      .maybeSingle();
    if (!existingVr) {
      await supabase.from("vet_reviews").insert({
        case_id: caseId,
        review_status: "pending",
      });
    }
  }

  if (outcome.treatments.length > 0) {
    await supabase.from("treatment_plans").insert({
      case_id: caseId,
      region,
      treatments: outcome.treatments.map((t) => ({
        drug_name: t.drug_name,
        generic_name: t.generic_name,
        dosage_text: t.dosage_text,
        course_duration_text: t.course_duration_text ?? null,
        supportive_care: t.supportive_care,
        prescription_required: t.prescription_required,
        isolation_required: t.isolation_required,
        source_reference: t.source_reference,
        available_in_your_region: t.available_in_your_region,
        image_url: t.image_url ?? null,
      })),
      dosage: { note: "From structured database — confirm with a veterinarian" },
    });
  }

  return {
    health_status,
    confidence,
    possible_conditions,
    severity,
    requiresMoreData,
    caseStatus,
  };
}

export { mapCaseStatus, healthStatusFromAssessment };
