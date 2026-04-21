import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchTreatmentsForCondition } from "@/lib/ai/treatments";

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

    let conditionCode = conditionCodeParam;

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

      if (!conditionCode) {
        const { data: assess } = await supabase
          .from("ai_assessments")
          .select("knowledge_matches, likely_condition")
          .eq("case_id", caseId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const km = assess?.knowledge_matches as { condition_code?: string }[] | null;
        if (Array.isArray(km) && km[0]?.condition_code) {
          conditionCode = km[0].condition_code;
        }
        if (!conditionCode && assess?.likely_condition) {
          const { data: condRow } = await supabase
            .from("knowledge_conditions")
            .select("condition_code")
            .ilike("condition_name", `%${assess.likely_condition}%`)
            .maybeSingle();
          conditionCode = condRow?.condition_code ?? null;
        }
        if (!condition && assess?.likely_condition) {
          condition = assess.likely_condition;
        }
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
      message:
        treatments.length > 0
          ? `Found ${treatments.length} structured option(s) for ${condition || "this condition"}. Availability in ${region} is noted per option.`
          : `No database treatment rows for this condition yet.`,
    });
  } catch (error) {
    console.error("Treatment Error:", error);
    return NextResponse.json({ error: "Failed to fetch treatments" }, { status: 500 });
  }
}
