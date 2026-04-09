import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runCaseAssessment } from "@/lib/ai/assess";

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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const animal = data.animal as string;
    const rawSymptoms = (data.symptoms as string[]) ?? [];
    const symptoms = rawSymptoms.map((s) => String(s).trim()).filter(Boolean);
    const imageUrlsFromClient = (data.image_urls as string[]) ?? [];
    const storagePaths = (data.storage_paths as string[]) ?? [];

    if (!animal) {
      return NextResponse.json({ error: "animal is required" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("region")
      .eq("id", user.id)
      .maybeSingle();

    const region = profile?.region ?? "Northern Highlands District";

    const visionUrls: string[] = [...imageUrlsFromClient];
    for (const p of storagePaths) {
      if (typeof p !== "string" || !p.startsWith(`${user.id}/`)) {
        return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
      }
      const { data: signed, error: signErr } = await supabase.storage
        .from("case-media")
        .createSignedUrl(p, 3600);
      if (!signErr && signed?.signedUrl) {
        visionUrls.push(signed.signedUrl);
      }
    }

    const outcome = await runCaseAssessment(supabase, {
      animal,
      symptoms,
      region,
      visionUrls,
    });

    const a = outcome.assessment;
    const health_status = healthStatusFromAssessment(a.health_status);
    const confidence = Math.round(a.confidence);
    const possible_conditions = a.possible_conditions;
    const severity = a.severity;
    const requiresMoreData = !!a.needs_more_info;
    const caseStatus = mapCaseStatus(a.recommendation_type);

    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .insert({
        user_id: user.id,
        animal_type: animal,
        health_status,
        confidence: confidence.toString(),
        mode: health_status === "healthy" ? "observation" : "diagnosis",
        status: caseStatus,
      })
      .select("id")
      .single();

    if (caseError) throw caseError;
    const caseId = caseData.id;

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

    const recommendationsList: string[] = [
      ...a.suggested_next_checks,
      outcome.disclaimer,
    ];

    if (health_status !== "healthy") {
      const { error: analysisError } = await supabase.from("case_analysis").insert({
        case_id: caseId,
        possible_conditions,
        severity,
        recommendations: recommendationsList,
      });
      if (analysisError) throw analysisError;
    }

    const likely =
      a.differential_diagnoses?.[0]?.condition ?? possible_conditions[0] ?? null;

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
      await supabase.from("vet_reviews").insert({
        case_id: caseId,
        review_status: "pending",
      });
    }

    if (outcome.treatments.length > 0) {
      await supabase.from("treatment_plans").insert({
        case_id: caseId,
        region,
        treatments: outcome.treatments.map((t) => ({
          drug: t.drug_name,
          generic: t.generic_name,
          dosage: t.dosage_text,
          supportive: t.supportive_care,
        })),
        dosage: { note: "From structured database — confirm with a veterinarian" },
      });
    }

    return NextResponse.json({
      case_id: caseId,
      health_status,
      confidence,
      requires_more_data: requiresMoreData,
      possible_conditions,
      severity,
      summary: a.summary,
      differential_diagnoses: a.differential_diagnoses,
      supporting_evidence: a.supporting_evidence,
      missing_information: a.missing_information,
      red_flags: a.red_flags,
      needs_more_info: a.needs_more_info,
      suggested_next_checks: a.suggested_next_checks,
      recommendation_type: a.recommendation_type,
      knowledge_matches: outcome.knowledge_matches,
      treatments: outcome.treatments,
      model_used: outcome.model_used,
      disclaimer: outcome.disclaimer,
      message:
        health_status === "healthy"
          ? "No strong signs of illness detected."
          : "Assessment recorded. Review details and consult a vet when in doubt.",
    });
  } catch (error) {
    console.error("Analyze Error:", error);
    return NextResponse.json({ error: "Failed to analyze case" }, { status: 500 });
  }
}
