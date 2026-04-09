import type { SupabaseClient } from "@supabase/supabase-js";

export type TreatmentRow = {
  drug_name: string;
  generic_name: string | null;
  dosage_text: string | null;
  supportive_care: string | null;
  prescription_required: boolean | null;
  isolation_required: boolean | null;
  source_reference: string | null;
};

/**
 * Load structured treatments from DB only (no LLM-invented drugs).
 */
export async function fetchTreatmentsForCondition(
  supabase: SupabaseClient,
  args: {
    conditionCode: string | null;
    species: string;
    region: string;
  }
): Promise<TreatmentRow[]> {
  if (!args.conditionCode) return [];

  const { data: cond, error: cErr } = await supabase
    .from("knowledge_conditions")
    .select("id")
    .eq("condition_code", args.conditionCode)
    .maybeSingle();

  if (cErr || !cond?.id) return [];

  const { data: plans, error: pErr } = await supabase
    .from("condition_treatments")
    .select(
      `
      dosage_text,
      supportive_care,
      prescription_required,
      isolation_required,
      source_reference,
      region,
      drug_database (
        active_ingredient,
        brand_name
      )
    `
    )
    .eq("condition_id", cond.id);

  if (pErr || !plans?.length) return [];

  const out: TreatmentRow[] = [];
  for (const row of plans as unknown[]) {
    const p = row as {
      dosage_text: string | null;
      supportive_care: string | null;
      prescription_required: boolean | null;
      isolation_required: boolean | null;
      source_reference: string | null;
      region: string | null;
      drug_database:
        | { active_ingredient: string; brand_name: string }
        | { active_ingredient: string; brand_name: string }[]
        | null;
    };
    if (p.region && p.region !== args.region) continue;
    const d = Array.isArray(p.drug_database) ? p.drug_database[0] : p.drug_database;
    if (!d?.brand_name) continue;
    out.push({
      drug_name: d.brand_name,
      generic_name: d.active_ingredient,
      dosage_text: p.dosage_text,
      supportive_care: p.supportive_care,
      prescription_required: p.prescription_required,
      isolation_required: p.isolation_required,
      source_reference: p.source_reference,
    });
  }

  return out;
}
