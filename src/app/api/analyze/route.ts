import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runCaseAssessment } from "@/lib/ai/assess";
import { persistCaseAssessmentArtifacts, healthStatusFromAssessment, mapCaseStatus } from "@/lib/persist-case-assessment";
import { formatFollowupsForPrompt } from "@/lib/format-followups";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    const rawSymptoms = (data.symptoms as string[]) ?? [];
    const symptoms = rawSymptoms.map((s) => String(s).trim()).filter(Boolean);
    const imageUrlsFromClient = (data.image_urls as string[]) ?? [];
    const storagePaths = (data.storage_paths as string[]) ?? [];
    const existingCaseId =
      typeof data.case_id === "string" && UUID_RE.test(data.case_id) ? data.case_id : null;

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

    let animal = typeof data.animal === "string" ? data.animal.trim() : "";
    let followupContext: string | undefined;
    let followupRows: { created_at: string; notes: string | null; status: string | null }[] = [];

    if (existingCaseId) {
      const { data: existingCase, error: caseErr } = await supabase
        .from("cases")
        .select("id, animal_type")
        .eq("id", existingCaseId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (caseErr || !existingCase) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
      }

      if (!animal) {
        animal = existingCase.animal_type;
      }

      const { data: fu } = await supabase
        .from("followups")
        .select("created_at, notes, status")
        .eq("case_id", existingCaseId)
        .order("created_at", { ascending: true });

      followupRows = fu ?? [];

      const { data: lastAi } = await supabase
        .from("ai_assessments")
        .select("summary")
        .eq("case_id", existingCaseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const fp = formatFollowupsForPrompt(followupRows);
      const prior = lastAi?.summary?.trim();
      followupContext = [
        prior && `Previous Dr Morgees assessment summary:\n${prior}`,
        fp && `Follow-up log (oldest first):\n${fp}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      const hasInputs = symptoms.length > 0 || visionUrls.length > 0 || followupRows.length > 0;
      if (!hasInputs) {
        return NextResponse.json(
          {
            error:
              "Add symptoms or media on New case, or save at least one follow-up note before re-running analysis.",
          },
          { status: 400 }
        );
      }
    } else {
      if (!animal) {
        return NextResponse.json({ error: "animal is required" }, { status: 400 });
      }
    }

    let symptomsForMatch = symptoms;
    if (symptomsForMatch.length === 0 && followupRows.length > 0) {
      const lastNote = followupRows[followupRows.length - 1]?.notes?.trim();
      symptomsForMatch = lastNote
        ? [lastNote.slice(0, 500)]
        : ["Ongoing case — see follow-up log in assessment prompt."];
    }

    const outcome = await runCaseAssessment(supabase, {
      animal,
      symptoms: symptomsForMatch,
      region,
      visionUrls,
      followupContext: followupContext || null,
    });

    const a = outcome.assessment;

    if (existingCaseId) {
      const persisted = await persistCaseAssessmentArtifacts(supabase, {
        caseId: existingCaseId,
        region,
        outcome,
        symptoms,
        storagePaths,
        updateCaseRow: true,
      });

      return NextResponse.json({
        case_id: existingCaseId,
        health_status: persisted.health_status,
        confidence: persisted.confidence,
        requires_more_data: persisted.requiresMoreData,
        possible_conditions: persisted.possible_conditions,
        severity: persisted.severity,
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
        message: "Follow-up context included. Assessment updated for this case.",
        reassessment: true,
      });
    }

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

    await persistCaseAssessmentArtifacts(supabase, {
      caseId,
      region,
      outcome,
      symptoms,
      storagePaths,
      updateCaseRow: false,
    });

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
