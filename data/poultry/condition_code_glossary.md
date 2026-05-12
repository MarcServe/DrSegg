# Poultry `condition_code` glossary (freeze before bulk seed)

Authoring corpus: YAML batches numbered past 200 authoring IDs plus compact master slugs — **canonical key is always `condition_code`** in SQL.

This file records **merge / dedup decisions**. Apply before running large `INSERT`s.

## High-priority merges (pick one slug per bullet)

| Topic | Choices | Recommendation |
| --- | --- | --- |
| Ammonia cascade | ammonia_burn / ammonia_poisoning / ammonia_toxicity / ammonia_keratoconjunctivitis | Keep separate only if chunks separate ocular-only vs systemic; otherwise ladder in one branch + JSON differentials |
| Heat / cold | heat_stress / hyperthermia, cold_stress / hypothermia | Merge editorially OR chunks must separate acute flock heat vs heat-stroke wording |
| Waterbelly vs ascites | waterbelly_syndrome | Same clinical picture space as `ascites` for broilers — merge or differentiate in prose |
| Blackhead turkey | turkey_blackhead | Overlaps `histomoniasis` — merge or duplicate with identical treatment governance |
| CAV naming | chicken_anemia_virus / chicken_anemia_virus_infection | One canonical slug; merge authoring |
| IBD duplication | cloacal_bursitis / immune_bursal_atrophy / infectious_bursal_disease / ibd_gumboro | Align with seeded `ibd_gumboro` vs migrate alias `infectious_bursal_disease` |
| Marek subgroup | mareks_disease / ocular_mareks_disease / range_paralysis | Subtype JSON or separate codes — avoid triple paralysis hits without chunk gates |
| Keel lesions | keel_bone_damage / keel_bone_fracture | Decide single vs fracture-specific |
| Enteric umbrellas | septicemia / enteritis / multicausal_enteric_syndrome / severe_flock_stunting_disorder / pale_bird_syndrome | Keep sparingly — heavy overlap with specific agents |
| Synovitis | infectious_synovitis / synovitis | Merge or cite etiology in chunks |
| Respiratory umbrellas | chronic_respiratory_disease / infectious_bronchitis / infectious_laryngotracheitis / avian_influenza_production_impact | Separate **agents** where treatments/notifiable flags differ; avoid duplicate “generic respiratory distress” codes hitting all sinus signs |
| Mold / feed toxins | mold_poisoning / mycotoxin_poisoning / aflatoxin_poisoning / feed_poisoning | Decide taxonomy (toxin vs substrate vs syndrome); align chunks so ammonia vs mold vs bacterial toxins don’t alias blindly |

## Corpus diff workflow (before bulk INSERT)

1. Export or list **all** YAML `condition_code` values + **existing** `knowledge_conditions.condition_code` from Supabase (including `22222222-*` / `44444444-*` seeds).
2. Normalize casing and separators (`snake_case`); flag collisions where **different authoring IDs** map to the **same clinical slug** candidate.
3. For each merge row above, pick **one canonical** code and record YAML→canonical redirects in authoring notes (future migrations can insert aliases into chunks only after governance review).
4. Only then generate migrations with **`ON CONFLICT (condition_code) DO UPDATE`** where updates are intentional; otherwise **`DO NOTHING`** for safety.

## Repo seed snippets (baseline)

Early seeds live in migrations under `22222222-*` IDs (`coccidiosis`, `newcastle_disease`, `heat_stress`, …) and expansion `44444444-*`. Cross-check **`ON CONFLICT (condition_code)`** before inserting new poultry rows.
