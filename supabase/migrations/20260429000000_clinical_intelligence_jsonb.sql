-- Phase 2: structured clinical envelopes for monitoring / escalation / multimodal authoring.
-- Matches poultry intelligence plan — single JSON blob per condition; optional blob per treatment row.

ALTER TABLE public.knowledge_conditions
  ADD COLUMN IF NOT EXISTS clinical_intelligence JSONB;

COMMENT ON COLUMN public.knowledge_conditions.clinical_intelligence IS
  'YAML-derived clinical envelope: monitoring, recovery/escalation, prevention, follow-up, visual_patterns, behavior_patterns, audio_patterns. Edited only via migrations or admin tooling until CMS exists.';

ALTER TABLE public.condition_treatments
  ADD COLUMN IF NOT EXISTS protocol_detail JSONB;

COMMENT ON COLUMN public.condition_treatments.protocol_detail IS
  'Drug-row-specific clinical protocol snippets (withdrawal windows, flock strategy) when differing from sibling rows.';

-- Sample documents (education / prompt enrichment). Expand via future migrations after glossary freeze.
UPDATE public.knowledge_conditions
SET clinical_intelligence = $json$
{
  "monitoring_protocol": {
    "check_interval_hours": 12,
    "monitor": ["droppings", "water intake", "appetite", "activity", "mortality"],
    "farmer_questions": [
      "Is blood reducing in droppings?",
      "Are birds eating again?",
      "Are birds more active?"
    ]
  },
  "recovery_indicators": {
    "positive_signs": [
      "reduced blood in droppings",
      "improved appetite",
      "firmer droppings"
    ],
    "expected_recovery_days": { "minimum": 5, "maximum": 14 }
  },
  "escalation_indicators": {
    "urgent": [
      "severe dehydration",
      "inability to stand",
      "rising mortality",
      "worsening signs after 48 hours"
    ],
    "actions": ["contact veterinarian", "isolate weakest birds"]
  },
  "prevention_plan": [
    "maintain dry litter",
    "sanitize drinkers",
    "avoid overcrowding"
  ],
  "visual_patterns": ["bloody droppings photo", "huddling", "ruffled feathers"],
  "behavior_patterns": ["lethargy", "reduced feeding"],
  "audio_patterns": []
}
$json$::jsonb
WHERE condition_code = 'coccidiosis';

UPDATE public.knowledge_conditions
SET clinical_intelligence = $json$
{
  "monitoring_protocol": {
    "monitor_every_hours": 2,
    "monitor": ["breathing rate", "water consumption", "distribution in house", "mortality"]
  },
  "recovery_indicators": {
    "positive_signs": ["normal breathing", "active drinking", "calmer stance"]
  },
  "escalation_indicators": {
    "urgent": ["collapse", "seizures", "sudden death", "flock pile-ups"],
    "actions": ["aggressive cooling", "improve airflow", "veterinary help if progressing"]
  },
  "prevention_plan": ["ventilation capacity", "cool water access", "reduce stocking density in heat"],
  "visual_patterns": ["panting", "wings held away from body", "dark comb"],
  "behavior_patterns": ["lethargy", "crowding toward drinkers"],
  "audio_patterns": []
}
$json$::jsonb
WHERE condition_code = 'heat_stress';
