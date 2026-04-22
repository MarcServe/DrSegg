/**
 * Merged case activity timeline: follow-ups, analyses, documents, and case opened.
 * Sorts newest first; uses relative time labels for recent events.
 */

export type CaseTimelineEventKind = "case_opened" | "followup" | "analysis" | "document";

export type CaseTimelineEvent = {
  id: string;
  at: string;
  kind: CaseTimelineEventKind;
  title: string;
  detail: string;
  /** For follow-up rows */
  followupStatus: "improving" | "worsening" | "unchanged" | null;
  href: string;
};

const MAX_EVENTS = 25;

function parseTime(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Short relative label: "Just now" … "6 days ago" or absolute date. */
export function formatCaseTimelineWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const now = Date.now();
  const diffMs = now - d.getTime();
  if (diffMs < 0) return d.toLocaleString();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  const yNow = new Date().getFullYear();
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== yNow ? "numeric" : undefined,
  });
}

function followupStatusKey(
  s: string | null | undefined
): "improving" | "worsening" | "unchanged" {
  if (s === "improving" || s === "worsening" || s === "unchanged") return s;
  return "unchanged";
}

export function buildCaseTimeline(input: {
  caseId: string;
  caseOpenedAt: string | null;
  animalType: string;
  followups: { id: string; created_at: string; notes: string | null; status: string | null }[];
  reports: { id: string; created_at: string; summary: string | null; likely_condition: string | null }[];
  documents: { id: string; created_at: string; title: string }[];
}): CaseTimelineEvent[] {
  const { caseId, caseOpenedAt, animalType, followups, reports, documents } = input;
  const events: CaseTimelineEvent[] = [];

  if (caseOpenedAt) {
    events.push({
      id: `case-opened-${caseId.slice(0, 8)}`,
      at: caseOpenedAt,
      kind: "case_opened",
      title: "Case opened",
      detail: `Started — ${animalType}`,
      followupStatus: null,
      href: `/case/${caseId}`,
    });
  }

  for (const f of followups) {
    if (!f.created_at) continue;
    const notePreview = (f.notes || "").trim() || "Follow-up check-in";
    events.push({
      id: `fu-${f.id}`,
      at: f.created_at,
      kind: "followup",
      title: "Follow-up",
      detail: notePreview.length > 160 ? `${notePreview.slice(0, 157)}…` : notePreview,
      followupStatus: followupStatusKey(f.status),
      href: `/follow-up?case=${caseId}`,
    });
  }

  for (const r of reports) {
    if (!r.created_at) continue;
    const head = r.likely_condition ? `${r.likely_condition}` : "Dr Morgees report";
    const sum = (r.summary || "").trim();
    const detail = sum
      ? sum.length > 180
        ? `${sum.slice(0, 177)}…`
        : sum
      : "New assessment added.";
    events.push({
      id: `as-${r.id}`,
      at: r.created_at,
      kind: "analysis",
      title: head,
      detail,
      followupStatus: null,
      href: `/analysis-result?case=${caseId}`,
    });
  }

  for (const doc of documents) {
    if (!doc.created_at) continue;
    events.push({
      id: `doc-${doc.id}`,
      at: doc.created_at,
      kind: "document",
      title: "Record uploaded",
      detail: doc.title,
      followupStatus: null,
      href: `/records?case=${caseId}`,
    });
  }

  events.sort((a, b) => {
    const ta = parseTime(a.at);
    const tb = parseTime(b.at);
    if (tb !== ta) return tb - ta;
    return a.id.localeCompare(b.id);
  });

  return events.slice(0, MAX_EVENTS);
}

export function caseTimelineBadgeClass(kind: CaseTimelineEventKind, followupStatus: CaseTimelineEvent["followupStatus"]): {
  label: string;
  chip: string;
} {
  if (kind === "case_opened") {
    return { label: "Case", chip: "bg-[var(--color-primary)] text-white" };
  }
  if (kind === "followup") {
    if (followupStatus === "improving") {
      return { label: "Follow-up", chip: "bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed)]" };
    }
    if (followupStatus === "worsening") {
      return { label: "Follow-up", chip: "bg-[var(--color-tertiary-fixed)] text-[var(--color-on-tertiary-fixed-variant)]" };
    }
    return { label: "Follow-up", chip: "bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]" };
  }
  if (kind === "analysis") {
    return { label: "Report", chip: "bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)]" };
  }
  return { label: "Record", chip: "bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)]" };
}
