import type { SupabaseClient } from "@supabase/supabase-js";

export type TreatmentRow = {
  drug_name: string;
  generic_name: string | null;
  dosage_text: string | null;
  supportive_care: string | null;
  prescription_required: boolean | null;
  isolation_required: boolean | null;
  source_reference: string | null;
  /** When false, the option may not match local product listings. Omitted on older snapshots → treated as true */
  available_in_your_region?: boolean;
  /** Product image when stored on drug_database (public URL) */
  image_url?: string | null;
};

type PlanRow = {
  dosage_text: string | null;
  supportive_care: string | null;
  prescription_required: boolean | null;
  isolation_required: boolean | null;
  source_reference: string | null;
  region: string | null;
  species: string | null;
  treatment_level: string | null;
  drug_database:
    | {
        active_ingredient: string;
        brand_name: string;
        image_url?: string | null;
      }
    | {
        active_ingredient: string;
        brand_name: string;
        image_url?: string | null;
      }[]
    | null;
};

function speciesMatches(rowSpecies: string | null, animalSpecies: string): boolean {
  if (!rowSpecies) return true;
  const r = rowSpecies.trim().toLowerCase();
  const a = animalSpecies.trim().toLowerCase();
  return r === "all" || r === a;
}

function rowAvailability(regionOnRow: string | null, userRegion: string): boolean {
  if (!regionOnRow || !regionOnRow.trim()) return true;
  return regionOnRow.trim() === userRegion.trim();
}

/**
 * Load structured treatments from DB only (no LLM-invented drugs).
 * Lists all condition-matched options first; regional availability is a flag, not a filter.
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

  const selectWithImage = `
      dosage_text,
      supportive_care,
      prescription_required,
      isolation_required,
      source_reference,
      region,
      species,
      treatment_level,
      drug_database (
        active_ingredient,
        brand_name,
        image_url
      )
    `;

  const selectNoImage = `
      dosage_text,
      supportive_care,
      prescription_required,
      isolation_required,
      source_reference,
      region,
      species,
      treatment_level,
      drug_database (
        active_ingredient,
        brand_name
      )
    `;

  let { data: plans, error: pErr } = await supabase
    .from("condition_treatments")
    .select(selectWithImage)
    .eq("condition_id", cond.id);

  if (pErr && (pErr.message ?? "").toLowerCase().includes("image_url")) {
    const r2 = await supabase.from("condition_treatments").select(selectNoImage).eq("condition_id", cond.id);
    plans = r2.data as typeof plans;
    pErr = r2.error;
  }

  if (pErr || !plans?.length) return [];

  const out: TreatmentRow[] = [];
  const seen = new Set<string>();

  for (const row of plans as unknown[]) {
    const p = row as PlanRow;
    if (!speciesMatches(p.species, args.species)) continue;

    const available = rowAvailability(p.region, args.region);

    const d = Array.isArray(p.drug_database) ? p.drug_database[0] : p.drug_database;

    if (d?.brand_name) {
      const image_url = d.image_url ?? null;
      const item: TreatmentRow = {
        drug_name: d.brand_name,
        generic_name: d.active_ingredient ?? null,
        dosage_text: p.dosage_text,
        supportive_care: p.supportive_care,
        prescription_required: p.prescription_required,
        isolation_required: p.isolation_required,
        source_reference: p.source_reference,
        available_in_your_region: available,
        image_url,
      };
      const key = `drug:${item.drug_name}|${item.dosage_text ?? ""}|${item.generic_name ?? ""}`;
      if (seen.has(key)) {
        const idx = out.findIndex((x) => `drug:${x.drug_name}|${x.dosage_text ?? ""}|${x.generic_name ?? ""}` === key);
        if (idx >= 0 && available && !out[idx].available_in_your_region) {
          out[idx] = { ...out[idx], available_in_your_region: true };
        }
        continue;
      }
      seen.add(key);
      out.push(item);
      continue;
    }

    if (p.supportive_care || p.dosage_text) {
      const title =
        p.treatment_level === "first_line"
          ? "First-line management"
          : p.treatment_level === "supportive"
            ? "Supportive & environmental care"
            : "Condition management";
      const item: TreatmentRow = {
        drug_name: title,
        generic_name: null,
        dosage_text: p.dosage_text,
        supportive_care: p.supportive_care,
        prescription_required: p.prescription_required,
        isolation_required: p.isolation_required,
        source_reference: p.source_reference,
        available_in_your_region: available,
        image_url: null,
      };
      const key = `sup:${title}|${p.dosage_text ?? ""}|${(p.supportive_care ?? "").slice(0, 40)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }

  out.sort((a, b) => {
    if (a.available_in_your_region === b.available_in_your_region) return 0;
    return a.available_in_your_region ? -1 : 1;
  });

  return out;
}
