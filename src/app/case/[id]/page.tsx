import Link from "next/link";
import { notFound } from "next/navigation";
import BottomNavBar from "@/components/BottomNavBar";
import { CaseNameEditor } from "@/components/CaseNameEditor";
import { AnimalIcon, animalTypeToIconKey } from "@/components/AnimalIcon";
import { createClient } from "@/lib/supabase/server";
import {
  CASE_DETAIL_PAGE_SELECT_NO_NAME,
  CASE_DETAIL_PAGE_SELECT_WITH_NAME,
  isMissingDisplayNameColumn,
} from "@/lib/case-detail-select";
import { buildCaseTimeline, caseTimelineBadgeClass, formatCaseTimelineWhen } from "@/lib/case-timeline";
import { CaseMonitoringBar } from "@/components/CaseMonitoringBar";

type PageProps = { params: Promise<{ id: string }> };

export default async function CaseDetail({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  let { data: row, error } = await supabase
    .from("cases")
    .select(CASE_DETAIL_PAGE_SELECT_WITH_NAME)
    .eq("id", id)
    .maybeSingle();

  if (error && isMissingDisplayNameColumn(error)) {
    const r2 = await supabase
      .from("cases")
      .select(CASE_DETAIL_PAGE_SELECT_NO_NAME)
      .eq("id", id)
      .maybeSingle();
    row = r2.data ? { ...r2.data, display_name: null } : null;
    error = r2.error;
  }

  if (error || !row) {
    notFound();
  }

  const { data: attachedDocs } = await supabase
    .from("farm_documents")
    .select("id, title, doc_type, created_at")
    .eq("case_id", id)
    .order("created_at", { ascending: false });

  const { data: reportHistory } = await supabase
    .from("ai_assessments")
    .select("id, created_at, summary, confidence_score, severity, likely_condition")
    .eq("case_id", id)
    .order("created_at", { ascending: false });

  const analysis = Array.isArray(row.case_analysis)
    ? row.case_analysis[0]
    : row.case_analysis;
  const aiRows = row.ai_assessments as
    | { summary: string | null; confidence_score: number | null; recommendation_type: string | null; needs_more_info: boolean | null }[]
    | { summary: string | null; confidence_score: number | null; recommendation_type: string | null; needs_more_info: boolean | null }
    | null;
  const aiAssessment = Array.isArray(aiRows) ? aiRows[0] : aiRows;
  const followups = (Array.isArray(row.followups) ? row.followups : []) as {
    id: string;
    created_at: string;
    notes: string | null;
    status: string | null;
  }[];

  const sortedFollowups = [...followups].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const caseTitle =
    row.display_name?.trim() ||
    `${row.animal_type} · ${row.created_at ? new Date(row.created_at).toLocaleDateString() : "case"}`;

  const timelineEvents = buildCaseTimeline({
    caseId: id,
    caseOpenedAt: row.created_at,
    animalType: row.animal_type,
    followups: sortedFollowups,
    reports: reportHistory ?? [],
    documents: (attachedDocs ?? []).map((d) => ({
      id: d.id,
      created_at: d.created_at,
      title: d.title,
    })),
  });

  const subtitle =
    aiAssessment?.summary?.slice(0, 120) ||
    (analysis?.possible_conditions as string[] | undefined)?.[0] ||
    row.health_status?.replace(/_/g, " ") ||
    "Case review";

  const speciesIconKey = animalTypeToIconKey(row.animal_type);
  const monitoringFromRow = (row as { monitoring_active?: boolean | null }).monitoring_active;
  const isActivelyMonitoring = monitoringFromRow !== false;

  return (
    <>
      <header className="bg-[#f9faf6] dark:bg-stone-950 flex justify-between items-center px-6 py-4 w-full sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            href="/cases"
            className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors p-2 rounded-full active:scale-95 duration-150"
          >
            arrow_back
          </Link>
          <div className="min-w-0 flex flex-col items-end gap-1 max-w-[70%]">
            <span className="text-[#0f5238] dark:text-emerald-400 font-manrope font-extrabold text-lg truncate w-full text-right">
              {caseTitle}
            </span>
            <span className="text-xs text-[var(--color-outline)] font-mono">#{row.id.slice(0, 8)}</span>
          </div>
        </div>
      </header>

      <main className="px-6 mt-6 max-w-4xl mx-auto space-y-8 pb-32">
        <Link
          href={`/records?case=${id}`}
          className="flex items-center gap-6 p-2 cursor-pointer active:scale-[0.99]"
        >
          <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm relative bg-[var(--color-surface-container-highest)] flex items-center justify-center shrink-0">
            {speciesIconKey ? (
              <AnimalIcon animal={speciesIconKey} size={80} label={row.animal_type} className="max-h-20" />
            ) : (
              <span className="text-2xl font-bold text-[var(--color-primary)] capitalize">
                {row.animal_type.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-[var(--color-outline)] mb-1 block">
              {row.created_at
                ? new Date(row.created_at).toLocaleDateString()
                : ""}
            </span>
            <CaseNameEditor caseId={id} initialName={row.display_name} animalType={row.animal_type} />
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">{subtitle}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)] px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                {row.status || "open"}
              </span>
            </div>
          </div>
        </Link>

        <CaseMonitoringBar caseId={id} initialMonitoringActive={isActivelyMonitoring} />

        <section className="space-y-4">
          <div className="flex items-center justify-between px-2 gap-4">
            <h2 className="text-xl font-bold font-manrope">Farm records</h2>
            <Link
              href={`/records?case=${id}`}
              className="text-sm font-bold text-[var(--color-primary)] shrink-0 hover:underline"
            >
              Upload
            </Link>
          </div>
          {attachedDocs && attachedDocs.length > 0 ? (
            <ul className="space-y-2">
              {attachedDocs.map((doc) => (
                <li
                  key={doc.id}
                  className="bg-[var(--color-surface-container-low)] px-4 py-3 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--color-primary)] shrink-0">
                      {doc.doc_type?.includes("pdf")
                        ? "picture_as_pdf"
                        : doc.doc_type?.startsWith("image")
                          ? "image"
                          : "description"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--color-on-surface)] truncate">{doc.title}</p>
                      <p className="text-xs text-[var(--color-outline)]">
                        {new Date(doc.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--color-on-surface-variant)] px-2">
              No documents linked yet. Use Upload to add PDFs, images, or receipts to this case.
            </p>
          )}
        </section>

        <section className="space-y-4 px-2">
          <div className="flex flex-wrap gap-3 text-sm font-bold">
            <Link href={`/new-case?case=${id}`} className="text-[var(--color-primary)] hover:underline">
              Add notes &amp; media
            </Link>
            <span className="text-[var(--color-outline)]">·</span>
            <Link
              href={`/follow-up?case=${id}`}
              className="text-[var(--color-primary)] hover:underline"
            >
              Follow-up
            </Link>
            <span className="text-[var(--color-outline)]">·</span>
            <Link href={`/treatment-options?case=${id}`} className="text-[var(--color-primary)] hover:underline">
              Treatments
            </Link>
            <span className="text-[var(--color-outline)]">·</span>
            <Link href={`/analysis-result?case=${id}`} className="text-[var(--color-primary)] hover:underline">
              Full analysis
            </Link>
            <span className="text-[var(--color-outline)]">·</span>
            <Link href={`/guided-inspection?case=${id}`} className="text-[var(--color-primary)] hover:underline">
              Guided inspection
            </Link>
          </div>
        </section>

        {reportHistory && reportHistory.length > 0 && (
          <section className="space-y-4 px-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-xl font-bold font-manrope">Merged reports</h2>
              <Link href={`/analysis-result?case=${id}`} className="text-sm font-bold text-[var(--color-primary)] hover:underline">
                Full detail view
              </Link>
            </div>
            <p className="text-sm text-[var(--color-on-surface-variant)]">
              Each run adds a new assessment; newest is first. Follow-up notes and media are included when you re-analyze.
            </p>
            <ul className="space-y-3">
              {reportHistory.map((r, i) => (
                <li
                  key={r.id}
                  className="bg-[var(--color-surface-container-low)] rounded-xl p-4 border border-[var(--color-outline-variant)]/20"
                >
                  <div className="flex flex-wrap justify-between gap-2 text-xs font-bold uppercase text-[var(--color-outline)]">
                    <span>
                      {i === 0 ? "Latest" : `Report ${reportHistory.length - i}`}
                      {r.created_at ? ` · ${new Date(r.created_at).toLocaleString()}` : ""}
                    </span>
                  </div>
                  {r.likely_condition && (
                    <p className="text-sm font-bold text-[var(--color-primary)] mt-2">{r.likely_condition}</p>
                  )}
                  <p className="text-sm text-[var(--color-on-surface-variant)] mt-2 line-clamp-4">
                    {r.summary || "No summary stored."}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-[var(--color-outline)]">
                    {r.confidence_score != null && <span>Confidence {Math.round(Number(r.confidence_score))}%</span>}
                    {r.severity && <span>{r.severity}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-4">
          <div className="px-2">
            <h2 className="text-xl font-bold font-manrope">Activity timeline</h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
              Follow-ups, Dr Morgees reports, and records — newest first. Times show how recently each item was added.
            </p>
          </div>
          <div className="space-y-3">
            {timelineEvents.length === 0 ? (
              <p className="text-sm text-[var(--color-on-surface-variant)] px-2">No activity yet for this case.</p>
            ) : (
              timelineEvents.map((item, idx) => {
                const { label: typeLabel, chip: typeChip } = caseTimelineBadgeClass(
                  item.kind,
                  item.followupStatus
                );
                const timeLabel = formatCaseTimelineWhen(item.at);
                const isNewest = idx === 0;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="bg-[var(--color-surface-container-low)] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-[var(--color-surface-container-high)] transition-colors border border-transparent hover:border-[var(--color-outline-variant)]/20"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          isNewest
                            ? "bg-[var(--color-primary)] text-white"
                            : "bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)]"
                        }`}
                      >
                        {timelineEvents.length - idx}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 gap-y-1">
                          {isNewest ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                              Latest
                            </span>
                          ) : null}
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${typeChip}`}
                          >
                            {typeLabel}
                          </span>
                          <span className="text-xs text-[var(--color-outline)] font-medium">
                            {timeLabel}
                            <span className="sr-only"> — {new Date(item.at).toLocaleString()}</span>
                          </span>
                        </div>
                        <p className="font-bold text-[var(--color-on-surface)] mt-0.5">{item.title}</p>
                        <p className="text-[var(--color-on-surface-variant)] text-sm line-clamp-3">{item.detail}</p>
                        {item.kind === "followup" && item.followupStatus ? (
                          <span
                            className={`inline-flex mt-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                              item.followupStatus === "improving"
                                ? "bg-[var(--color-primary-fixed)]/30 text-[var(--color-on-primary-fixed-variant)]"
                                : item.followupStatus === "worsening"
                                  ? "bg-red-200/50 text-red-900 dark:bg-red-950/50 dark:text-red-100"
                                  : "bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]"
                            }`}
                          >
                            {item.followupStatus === "improving"
                              ? "Improving"
                              : item.followupStatus === "worsening"
                                ? "Worsening"
                                : "Unchanged"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[var(--color-primary)] shrink-0 self-end sm:self-center">
                      Open →
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <div className="mt-12 text-center">
          <Link
            href={`/follow-up?case=${id}`}
            className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--color-primary)] text-white rounded-full shadow-2xl font-headline font-bold tracking-tight hover:opacity-90 active:scale-90 duration-150"
          >
            <span>Add Follow-up Update</span>
            <span className="material-symbols-outlined">add</span>
          </Link>
        </div>
      </main>

      <BottomNavBar />
    </>
  );
}
