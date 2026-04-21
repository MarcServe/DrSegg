/** Case row selects — fallback if `display_name` migration not applied yet. */
export const CASE_DETAIL_PAGE_SELECT_WITH_NAME = `
      id,
      display_name,
      animal_type,
      health_status,
      status,
      created_at,
      case_analysis ( possible_conditions, severity ),
      ai_assessments ( summary, confidence_score, recommendation_type, needs_more_info ),
      followups ( id, created_at, notes, status )
    `;

export const CASE_DETAIL_PAGE_SELECT_NO_NAME = `
      id,
      animal_type,
      health_status,
      status,
      created_at,
      case_analysis ( possible_conditions, severity ),
      ai_assessments ( summary, confidence_score, recommendation_type, needs_more_info ),
      followups ( id, created_at, notes, status )
    `;

export const CASE_API_GET_SELECT_WITH_NAME = `
        id,
        display_name,
        animal_type,
        health_status,
        status,
        confidence,
        created_at,
        followups ( id, created_at, notes, status ),
        ai_assessments (
          id,
          summary,
          confidence_score,
          severity,
          likely_condition,
          needs_more_info,
          recommendation_type,
          differential_diagnoses,
          supporting_evidence,
          red_flags,
          missing_info,
          suggested_next_checks,
          knowledge_matches,
          treatments_snapshot,
          model_name,
          disclaimer,
          created_at
        )
      `;

export const CASE_API_GET_SELECT_NO_NAME = `
        id,
        animal_type,
        health_status,
        status,
        confidence,
        created_at,
        followups ( id, created_at, notes, status ),
        ai_assessments (
          id,
          summary,
          confidence_score,
          severity,
          likely_condition,
          needs_more_info,
          recommendation_type,
          differential_diagnoses,
          supporting_evidence,
          red_flags,
          missing_info,
          suggested_next_checks,
          knowledge_matches,
          treatments_snapshot,
          model_name,
          disclaimer,
          created_at
        )
      `;

export function isMissingDisplayNameColumn(err: { message?: string } | null): boolean {
  const m = (err?.message ?? "").toLowerCase();
  return m.includes("display_name");
}
