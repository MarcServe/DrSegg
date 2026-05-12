/**
 * Multimodal → KB contract (implementations enqueue these payloads before `matchConditions`).
 *
 * Principle: modalities never emit a definitive diagnosis string; they normalize to **signals**
 * merged with manual_symptoms[], then retrieval + clinician-facing prompts run as today.
 */

export type SeverityBand = "mild" | "moderate" | "severe" | "emergency";

/** Body region for routing capture guides (`body_part_capture_guides`) */
export type AnatomicalBodyPart =
  | "eye"
  | "comb"
  | "vent"
  | "foot"
  | "droppings"
  | "feathers"
  | "neck"
  | "whole_bird";

export type SignalExtractionResult = {
  /** Canonical-ish tokens aligning with symptom_dictionary aliasing downstream */
  detected_signs: string[];
  body_parts?: AnatomicalBodyPart[];
  severity_band?: SeverityBand;
  /** 0–1 confidence for extraction quality only—not disease probability */
  confidence?: number;
  /** Farmer language preserved for audit / prompt grounding */
  source_transcript_fragment?: string;
};
