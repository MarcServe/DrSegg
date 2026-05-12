import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchTreatmentsForCondition } from "@/lib/ai/treatments";
import {
  pickConditionCodeForTreatment,
  type KnowledgeMatchLite,
} from "@/lib/ai/treatment-condition";
import { summarizeClinicalIntelligenceForPrompt } from "@/lib/ai/clinical-intelligence";

const CASE_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizedCaseId(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t && CASE_UUID.test(t) ? t : undefined;
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
    const region = (data.region as string) || "Northern Highlands District";
    let condition = typeof data.condition === "string" ? data.condition : "";
    const conditionCodeParam =
      typeof data.condition_code === "string" && data.condition_code.trim().length > 0
        ? data.condition_code.trim()
        : null;

    const caseId = normalizedCaseId(data.caseId);
    let species = typeof data.species === "string" && data.species.trim() ? data.species.trim() : "poultry";

    let conditionCode: string | null = null;

    if (caseId) {
      const { data: caseRow } = await supabase
        .from("cases")
        .select("animal_type")
        .eq("id", caseId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (caseRow?.animal_type) {
        species = caseRow.animal_type;
      }

      const { data: assess } = await supabase
        .from("ai_assessments")
        .select("resolved_condition_code, knowledge_matches, likely_condition, differential_diagnoses")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const persistedCode =
        typeof assess?.resolved_condition_code === "string" ? assess.resolved_condition_code.trim() : "";

      const km = assess?.knowledge_matches as KnowledgeMatchLite[] | null;
      const differentials = Array.isArray(assess?.differential_diagnoses)
        ? (assess.differential_diagnoses as { condition?: string }[])
        : [];

      if (persistedCode) {
        conditionCode = persistedCode;
      } else {
        conditionCode = pickConditionCodeForTreatment(km, assess?.likely_condition ?? null, differentials);

        /** likely_condition may be prose; longest condition_name substring match */
        if (!conditionCode && assess?.likely_condition?.trim()) {
          const ll = assess.likely_condition.toLowerCase();
          const { data: nameRows } = await supabase.from("knowledge_conditions").select("condition_code, condition_name");
          const candidates = (nameRows ?? []).filter(
            (r) => typeof r.condition_name === "string" && r.condition_name.length >= 4 && ll.includes(r.condition_name.toLowerCase())
          );
          candidates.sort((a, b) => (b.condition_name?.length ?? 0) - (a.condition_name?.length ?? 0));
          conditionCode = candidates[0]?.condition_code ?? null;
        }
      }

      if (!condition && typeof assess?.likely_condition === "string") {
        condition = assess.likely_condition;
      }
    } else {
      const kmRaw = Array.isArray(data.knowledge_matches)
        ? (data.knowledge_matches as KnowledgeMatchLite[])
        : [];
      const diffRaw = Array.isArray(data.differential_diagnoses)
        ? (data.differential_diagnoses as { condition?: string }[])
        : [];
      const likelyRaw =
        typeof data.likely_condition === "string" && data.likely_condition.trim()
          ? data.likely_condition.trim()
          : null;

      /** Prefer analyze `resolved_condition_code` when client sends it; otherwise same pick as `/api/analyze`. */
      if (conditionCodeParam) {
        conditionCode = conditionCodeParam;
      } else if (kmRaw.length > 0) {
        conditionCode = pickConditionCodeForTreatment(kmRaw, likelyRaw, diffRaw);
      }

      if (!conditionCode && condition) {
        const { data: condRow } = await supabase
          .from("knowledge_conditions")
          .select("condition_code")
          .ilike("condition_name", `%${condition}%`)
          .maybeSingle();
        conditionCode = condRow?.condition_code ?? (condition.includes("_") ? condition.trim() : null);
      }
    }

    if (!conditionCode && condition) {
      const { data: condRow } = await supabase
        .from("knowledge_conditions")
        .select("condition_code")
        .ilike("condition_name", `%${condition}%`)
        .maybeSingle();
      conditionCode = condRow?.condition_code ?? (condition.includes("_") ? condition.trim() : null);
    }

    const treatments = await fetchTreatmentsForCondition(supabase, {
      conditionCode,
      species,
      region,
    });

    let resolvedConditionName: string | null = null;
    let clinicalIntelligenceSummary: string | null = null;
    if (conditionCode) {
      const { data: kcRow } = await supabase
        .from("knowledge_conditions")
        .select("condition_name, clinical_intelligence")
        .eq("condition_code", conditionCode)
        .maybeSingle();
      resolvedConditionName = kcRow?.condition_name ?? null;
      clinicalIntelligenceSummary =
        summarizeClinicalIntelligenceForPrompt(kcRow?.clinical_intelligence) || null;
    }

    const warnings: string[] = [];
    if (treatments.length === 0) {
      warnings.push(
        "No structured treatment rows matched this condition in the database yet. Provide supportive care and consult a veterinarian for prescriptions and dosing."
      );
    } else {
      const notLocal = treatments.filter((t) => t.available_in_your_region === false).length;
      if (notLocal > 0) {
        warnings.push(
          `${notLocal} option(s) list products that may not be registered or stocked in ${region}. Confirm availability and legality with a veterinarian or supplier.`
        );
      }
    }

    return NextResponse.json({
      treatments,
      warnings,
      resolved_condition_code: conditionCode,
      resolved_condition_name: resolvedConditionName,
      clinical_intelligence_summary: clinicalIntelligenceSummary,
      message:
        treatments.length > 0
          ? `Found ${treatments.length} structured option(s) for ${resolvedConditionName || condition || "this condition"}. Availability in ${region} is noted per option.`
          : `No database treatment rows for this condition yet.`,
    });
  } catch (error) {
    console.error("Treatment Error:", error);
    return NextResponse.json({ error: "Failed to fetch treatments" }, { status: 500 });
  }
}
