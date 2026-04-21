import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchTreatmentsForCondition } from "@/lib/ai/treatments";
import {
  pickConditionCodeForTreatment,
  type KnowledgeMatchLite,
} from "@/lib/ai/treatment-condition";

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
    let condition = (data.condition as string) || "";
    const conditionCodeParam = (data.condition_code as string)?.trim() || null;
    const caseId = data.caseId as string | undefined;
    let species = (data.species as string) || "poultry";

    /** When a case is loaded, resolve from latest assessment — not knowledge_matches[0] (wrong for most cases). */
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
        .select("knowledge_matches, likely_condition, differential_diagnoses")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const km = assess?.knowledge_matches as KnowledgeMatchLite[] | null;
      const differentials = Array.isArray(assess?.differential_diagnoses)
        ? (assess.differential_diagnoses as { condition?: string }[])
        : [];
      conditionCode = pickConditionCodeForTreatment(km, assess?.likely_condition ?? null, differentials);

      /** likely_condition is often a paragraph; match longest condition_name contained in that text (not ilike the other way). */
      if (!conditionCode && assess?.likely_condition?.trim()) {
        const ll = assess.likely_condition.toLowerCase();
        const { data: nameRows } = await supabase.from("knowledge_conditions").select("condition_code, condition_name");
        const candidates = (nameRows ?? []).filter(
          (r) => typeof r.condition_name === "string" && r.condition_name.length >= 4 && ll.includes(r.condition_name.toLowerCase())
        );
        candidates.sort((a, b) => (b.condition_name?.length ?? 0) - (a.condition_name?.length ?? 0));
        conditionCode = candidates[0]?.condition_code ?? null;
      }
      if (!condition && assess?.likely_condition) {
        condition = assess.likely_condition;
      }
    } else {
      conditionCode = conditionCodeParam;
      if (!conditionCode && condition) {
        const { data: condRow } = await supabase
          .from("knowledge_conditions")
          .select("condition_code")
          .ilike("condition_name", `%${condition}%`)
          .maybeSingle();
        conditionCode = condRow?.condition_code ?? (condition.includes("_") ? condition : null);
      }
    }

    if (!conditionCode && condition) {
      const { data: condRow } = await supabase
        .from("knowledge_conditions")
        .select("condition_code")
        .ilike("condition_name", `%${condition}%`)
        .maybeSingle();
      conditionCode = condRow?.condition_code ?? (condition.includes("_") ? condition : null);
    }

    const treatments = await fetchTreatmentsForCondition(supabase, {
      conditionCode,
      species,
      region,
    });

    let resolvedConditionName: string | null = null;
    if (conditionCode) {
      const { data: kc } = await supabase
        .from("knowledge_conditions")
        .select("condition_name")
        .eq("condition_code", conditionCode)
        .maybeSingle();
      resolvedConditionName = kc?.condition_name ?? null;
    }

    if (caseId) {
      const { data: existing } = await supabase
        .from("cases")
        .select("id")
        .eq("id", caseId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing && treatments.length > 0) {
        await supabase.from("treatment_plans").insert({
          case_id: caseId,
          region,
          treatments,
          dosage: { note: "Structured database rows — confirm with veterinarian" },
        });
      }
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
