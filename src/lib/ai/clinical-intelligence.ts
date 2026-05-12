/**
 * Shape of optional `knowledge_conditions.clinical_intelligence` JSONB — extend as authoring grows.
 */
export type ClinicalMonitoringProtocol = {
  check_interval_hours?: number;
  monitor_every_hours?: number;
  monitor?: string[];
  farmer_questions?: string[];
};

export type ClinicalIntelBlob = {
  monitoring_protocol?: ClinicalMonitoringProtocol;
  recovery_indicators?: {
    positive_signs?: string[];
    expected_recovery_days?: { minimum?: number; maximum?: number };
    expected_recovery_window_days?: string;
  };
  escalation_indicators?: {
    urgent?: string[];
    actions?: string[];
  };
  prevention_plan?: string[];
  follow_up_protocol?: Record<string, unknown>;
  differential_conditions?: string[];
  visual_patterns?: string[];
  behavior_patterns?: string[];
  audio_patterns?: string[];
  /** Non-authoritative clinician notes — never surfaced as citations to end users unless reviewed */
  source_notes?: string[];
  [key: string]: unknown;
};

/** Per `condition_treatments.protocol_detail`. */
export type TreatmentProtocolDetail = {
  flock_strategy?: string[];
  expected_improvement_window_hours?: { minimum?: number; maximum?: number };
  withdrawal_summary?: string;
  [key: string]: unknown;
};

function asObj(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function stringifyList(label: string, items: unknown, maxItems: number): string {
  if (!Array.isArray(items) || items.length === 0) return "";
  const flat = items
    .slice(0, maxItems)
    .map((x) => String(x).trim())
    .filter(Boolean);
  if (!flat.length) return "";
  return `${label}: ${flat.join("; ")}`;
}

/**
 * Trimmed excerpt for assessment prompts (~400 chars combined per condition — keeps token use bounded).
 */
export function summarizeClinicalIntelligenceForPrompt(ci: unknown, maxChars = 400): string {
  const obj = asObj(ci);
  if (!obj) return "";

  const intel = ci as ClinicalIntelBlob;
  const parts: string[] = [];

  const mon = intel.monitoring_protocol;
  if (mon?.monitor?.length)
    parts.push(stringifyList("monitor", mon.monitor, 6));
  if (mon?.farmer_questions?.length)
    parts.push(stringifyList("ask", mon.farmer_questions, 3));

  if (intel.escalation_indicators?.urgent?.length)
    parts.push(stringifyList("escalate if", intel.escalation_indicators.urgent, 5));
  if (intel.recovery_indicators?.positive_signs?.length)
    parts.push(stringifyList("recovery signs", intel.recovery_indicators.positive_signs, 4));

  const patterns = [
    stringifyList("visual_patterns", intel.visual_patterns, 4),
    stringifyList("behavior_patterns", intel.behavior_patterns, 4),
    stringifyList("audio_patterns", intel.audio_patterns, 3),
  ].filter(Boolean);
  if (patterns.length) parts.push(patterns.join(" | "));

  let out = parts.join(" · ");
  if (out.length > maxChars) out = `${out.slice(0, maxChars - 1)}…`;
  return out;
}

const PROTO_DETAIL_KEYS = new Set([
  "flock_strategy",
  "expected_improvement_window_hours",
  "withdrawal_summary",
]);

/**
 * Short bullets for UI when `protocol_detail` JSON is present on a treatment row.
 */
export function describeTreatmentProtocolDetail(detail: unknown): string[] {
  const obj = asObj(detail);
  if (!obj) return [];

  const d = detail as TreatmentProtocolDetail;
  const lines: string[] = [];

  if (typeof d.withdrawal_summary === "string" && d.withdrawal_summary.trim()) {
    lines.push(`Withdrawal: ${d.withdrawal_summary.trim()}`);
  }

  if (Array.isArray(d.flock_strategy)) {
    for (const item of d.flock_strategy.slice(0, 10)) {
      const s = String(item).trim();
      if (s) lines.push(s);
    }
  }

  const win = d.expected_improvement_window_hours;
  if (
    win &&
    (typeof win.minimum === "number" || typeof win.maximum === "number")
  ) {
    const lo = typeof win.minimum === "number" ? win.minimum : "—";
    const hi = typeof win.maximum === "number" ? win.maximum : "—";
    lines.push(`Typical improvement window (hours): ${lo}–${hi}`);
  }

  for (const [k, v] of Object.entries(obj)) {
    if (PROTO_DETAIL_KEYS.has(k)) continue;
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim()) {
      lines.push(`${k}: ${v.trim()}`);
    } else if (typeof v === "number" || typeof v === "boolean") {
      lines.push(`${k}: ${String(v)}`);
    }
  }

  return lines.slice(0, 14);
}

export function protocolDetailNeedsRawFallback(detail: unknown): boolean {
  const obj = asObj(detail);
  if (!obj || Object.keys(obj).length === 0) return false;
  return describeTreatmentProtocolDetail(detail).length === 0;
}
