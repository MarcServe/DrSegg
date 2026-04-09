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
    const condition = (data.condition as string) || "";
    const conditionCodeParam = (data.condition_code as string)?.trim() || null;
    const caseId = data.caseId as string | undefined;
    const species = (data.species as string) || "poultry";

    let conditionCode = conditionCodeParam;

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
        "No region-specific drug rows matched this condition. Provide supportive care and consult a veterinarian for prescriptions and dosing."
      );
    }

    return NextResponse.json({
      treatments,
      warnings,
      message:
        treatments.length > 0
          ? `Found ${treatments.length} structured option(s) for ${condition || "condition"} in ${region}.`
          : `No database treatment rows for this lookup in ${region}.`,
    });
  } catch (error) {
    console.error("Treatment Error:", error);
    return NextResponse.json({ error: "Failed to fetch treatments" }, { status: 500 });
  }
}
