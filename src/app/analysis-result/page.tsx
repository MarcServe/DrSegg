"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCase } from "@/context/CaseContext";
import type { HealthStatus } from "@/context/CaseContext";
import BottomNavBar from "@/components/BottomNavBar";
import { AppLogo } from "@/components/AppLogo";
import { TreatmentRowDisplay } from "@/components/TreatmentRowDisplay";
import { AnimalIcon, animalTypeToIconKey } from "@/components/AnimalIcon";
import type { KnowledgeMatch } from "@/lib/ai/schemas";
import type { TreatmentRow } from "@/lib/ai/treatments";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Hydrated snapshots may omit newer fields; keep UI consistent */
function normalizeTreatmentRow(t: TreatmentRow): TreatmentRow {
  return {
    drug_name: t.drug_name,
    generic_name: t.generic_name ?? null,
    dosage_text: t.dosage_text ?? null,
    supportive_care: t.supportive_care ?? null,
    prescription_required: t.prescription_required ?? null,
    isolation_required: t.isolation_required ?? null,
    source_reference: t.source_reference ?? null,
    available_in_your_region: t.available_in_your_region !== false,
    image_url: t.image_url ?? null,
  };
}

type AssessmentHistoryItem = {
  id?: string;
  created_at?: string;
  summary?: string | null;
  confidence_score?: number | null;
  severity?: string | null;
  likely_condition?: string | null;
  model_name?: string | null;
};

function severityStyles(severityStr: string) {
  if (severityStr.includes("RED")) {
    return {
      severityColor: "bg-[var(--color-error)]",
      severityText: "text-[var(--color-on-error)]",
    };
  }
  if (severityStr.includes("YELLOW")) {
    return { severityColor: "bg-yellow-500", severityText: "text-white" };
  }
  return {
    severityColor: "bg-[var(--color-tertiary)]",
    severityText: "text-[var(--color-on-tertiary)]",
  };
}

function AnalysisResultInner() {
  const searchParams = useSearchParams();
  const caseParam = searchParams.get("case");
  const {
    caseState,
    setCaseId,
    setAnimalType,
    setRegion,
    setHealthStatus,
    setAnalysisResult,
    setAssessmentDetails,
    setSymptoms,
  } = useCase();
  const [hydrateState, setHydrateState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistoryItem[]>([]);

  useEffect(() => {
    if (!caseParam || !UUID_RE.test(caseParam)) {
      setHydrateState("done");
      return;
    }

    let cancelled = false;
    setHydrateState("loading");
    (async () => {
      try {
        const res = await fetch(`/api/cases/${caseParam}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load case");
        if (cancelled) return;

        const latest = data.latest_assessment as Record<string, unknown> | null;
        const history = (data.assessments as AssessmentHistoryItem[]) ?? [];
        setAssessmentHistory(history);

        const caseRow = data.case as {
          id: string;
          animal_type: string;
          health_status: string | null;
        };

        setCaseId(caseParam);
        setAnimalType(caseRow.animal_type);
        if (typeof data.region === "string") setRegion(data.region);

        if (latest) {
          const conf = Math.round(Number(latest.confidence_score) || 0);
          const hs = (caseRow.health_status || "likely_sick") as HealthStatus;
          setHealthStatus(hs, conf);

          const diffs = (latest.differential_diagnoses as { condition: string; confidence: number }[]) ?? [];
          const likely = typeof latest.likely_condition === "string" ? latest.likely_condition : "";
          const poss = likely
            ? [likely, ...diffs.map((d) => d.condition).filter((x) => x && x !== likely)]
            : diffs.map((d) => d.condition);
          const unique = [...new Set(poss)].slice(0, 12);

          setAnalysisResult(unique, String(latest.severity ?? "ORANGE (HIGH)"));
          setSymptoms([]);

          const km = (latest.knowledge_matches as KnowledgeMatch[]) ?? [];
          const tr = (latest.treatments_snapshot as TreatmentRow[]) ?? [];

          setAssessmentDetails({
            summary: typeof latest.summary === "string" ? latest.summary : null,
            needsMoreInfo: !!latest.needs_more_info,
            missingInformation: Array.isArray(latest.missing_info)
              ? (latest.missing_info as string[])
              : [],
            redFlags: Array.isArray(latest.red_flags) ? (latest.red_flags as string[]) : [],
            recommendationType:
              typeof latest.recommendation_type === "string" ? latest.recommendation_type : null,
            suggestedNextChecks: Array.isArray(latest.suggested_next_checks)
              ? (latest.suggested_next_checks as string[])
              : [],
            assessmentDisclaimer: typeof latest.disclaimer === "string" ? latest.disclaimer : null,
            differentialDiagnoses: Array.isArray(latest.differential_diagnoses)
              ? (latest.differential_diagnoses as { condition: string; confidence: number }[])
              : [],
            escalationSuggested:
              latest.recommendation_type === "emergency" ||
              latest.recommendation_type === "urgent_vet" ||
              (Array.isArray(latest.red_flags) && (latest.red_flags as string[]).length > 0),
            supportingEvidence: Array.isArray(latest.supporting_evidence)
              ? (latest.supporting_evidence as string[])
              : [],
            knowledgeMatches: km,
            treatments: tr,
            modelUsed: typeof latest.model_name === "string" ? latest.model_name : null,
          });
        }
        setHydrateState("done");
      } catch {
        if (!cancelled) setHydrateState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    caseParam,
    setCaseId,
    setAnimalType,
    setRegion,
    setHealthStatus,
    setAnalysisResult,
    setAssessmentDetails,
    setSymptoms,
  ]);

  const hasReal =
    (caseState.possibleConditions?.length ?? 0) > 0 ||
    (caseState.differentialDiagnoses?.length ?? 0) > 0;

  const primaryCondition =
    caseState.possibleConditions[0] ||
    caseState.differentialDiagnoses[0]?.condition ||
    (caseState.animalType ? `${caseState.animalType} — review signs` : "Assessment");

  const severityStr = caseState.severity || "ORANGE (HIGH)";
  const { severityColor, severityText } = severityStyles(severityStr);

  const description =
    caseState.summary ||
    (hasReal
      ? "Review differentials and evidence below. Structured drug options (if any) are listed under Treatment options — they come from the app database, not free‑written prescriptions."
      : "Run a new analysis from New case, or open a saved case with ?case=… in the URL, or go to Cases and open your case file.");

  const confidence = caseState.confidence || 0;

  const iconKey = caseState.animalType ? animalTypeToIconKey(caseState.animalType) : null;

  const caseQuery = caseState.caseId ? `?case=${caseState.caseId}` : "";

  return (
    <>
      <header className="bg-[#f9faf6] dark:bg-stone-950 flex justify-between items-center px-6 py-4 w-full sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            href="/health-status"
            className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors p-2 rounded-full active:scale-95 duration-150"
          >
            arrow_back
          </Link>
          <AppLogo href="/cases" size={104} />
        </div>
        <Link
          href="/profile"
          className="material-symbols-outlined text-[#414941] dark:text-stone-400 hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors p-2 rounded-full active:scale-95 duration-150"
          aria-label="Settings"
        >
          settings
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8 pb-32">
        {hydrateState === "loading" && (
          <p className="text-sm text-[var(--color-on-surface-variant)] text-center">Loading saved assessment…</p>
        )}
        {hydrateState === "error" && (
          <p className="text-sm text-[var(--color-error)] text-center">
            Could not load this case. Try opening it from{" "}
            <Link href="/cases" className="font-bold underline">
              Cases
            </Link>
            .
          </p>
        )}

        <div className="bg-[var(--color-surface-container-lowest)] p-8 rounded-xl shadow-[0px_12px_32px_rgba(44,105,78,0.08)] space-y-6">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <span className="text-sm font-bold text-[var(--color-primary)] bg-[var(--color-primary-fixed)] px-4 py-1 rounded-full uppercase tracking-widest">
                {assessmentHistory.length > 1 ? "Latest merged report" : "Analysis complete"}
              </span>
              <h2 className="font-headline text-3xl sm:text-4xl text-[var(--color-primary)] font-extrabold mt-4 leading-tight break-words">
                {primaryCondition}
              </h2>
            </div>
            <div className="flex flex-col items-end gap-3 shrink-0">
              {iconKey && (
                <div className="w-16 h-16 rounded-xl bg-[var(--color-surface-container-highest)] flex items-center justify-center overflow-hidden">
                  <AnimalIcon animal={iconKey} size={56} label={caseState.animalType || "Animal"} />
                </div>
              )}
              <div className="bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] p-4 rounded-xl text-center min-w-[80px]">
                <div className="text-2xl font-extrabold">{confidence}%</div>
                <div className="text-[10px] uppercase font-bold tracking-tighter">Confidence</div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-container-low)] p-6 rounded-lg space-y-3">
            <div className="flex justify-between items-center gap-2 flex-wrap">
              <span className="font-headline font-bold text-[var(--color-on-surface)]">Severity</span>
              <span className={`font-extrabold px-3 py-1 rounded-full text-sm ${severityColor} ${severityText}`}>
                {severityStr}
              </span>
            </div>
            <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed">{description}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={caseState.caseId ? `/treatment-options${caseQuery}` : "/treatment-options"}
              className="flex-1 text-center rounded-xl bg-[var(--color-primary)] text-white font-headline font-bold py-4 px-4 hover:opacity-95 active:scale-[0.99]"
            >
              Treatment options
            </Link>
            {caseState.caseId && (
              <Link
                href={`/case/${caseState.caseId}`}
                className="flex-1 text-center rounded-xl border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-bold py-4 px-4 hover:bg-[var(--color-primary)]/5"
              >
                Open case file
              </Link>
            )}
          </div>
          {caseState.caseId && (
            <>
              <Link
                href={`/records${caseQuery}`}
                className="block text-center text-sm font-semibold text-[var(--color-primary)] underline underline-offset-2"
              >
                Attach documents to this case
              </Link>
              <Link
                href={`/follow-up${caseQuery}`}
                className="block text-center text-sm font-semibold text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]"
              >
                Add follow-up notes →
              </Link>
            </>
          )}
        </div>

        {assessmentHistory.length > 1 && (
          <section className="space-y-3">
            <h3 className="font-headline text-lg font-bold text-[var(--color-on-surface)] px-1">
              Earlier AI reports on this case ({assessmentHistory.length - 1})
            </h3>
            <p className="text-xs text-[var(--color-outline)] px-1">
              New analyses and follow-up context are stored together on one case file.
            </p>
            <ul className="space-y-3">
              {assessmentHistory.slice(1).map((a) => (
                <li
                  key={a.id ?? a.created_at}
                  className="bg-[var(--color-surface-container-low)] rounded-xl p-4 border border-[var(--color-outline-variant)]/15"
                >
                  <div className="flex flex-wrap justify-between gap-2 text-xs font-bold text-[var(--color-outline)]">
                    <span>
                      {a.created_at ? new Date(a.created_at).toLocaleString() : "Earlier run"}
                    </span>
                  </div>
                  {a.likely_condition && (
                    <p className="text-sm font-bold text-[var(--color-primary)] mt-2">{a.likely_condition}</p>
                  )}
                  <p className="text-sm text-[var(--color-on-surface-variant)] mt-2 leading-relaxed">
                    {a.summary || "—"}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-[var(--color-outline)]">
                    {a.confidence_score != null && (
                      <span>Confidence {Math.round(Number(a.confidence_score))}%</span>
                    )}
                    {a.severity && <span>{a.severity}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {caseState.differentialDiagnoses.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-headline text-lg font-bold text-[var(--color-on-surface)] px-1">
              Differential diagnoses
            </h3>
            <ul className="space-y-2">
              {caseState.differentialDiagnoses.map((d, i) => (
                <li
                  key={`${d.condition}-${i}`}
                  className="bg-[var(--color-surface-container-low)] rounded-lg px-4 py-3 flex justify-between gap-3"
                >
                  <span className="font-medium text-[var(--color-on-surface)]">{d.condition}</span>
                  <span className="text-sm text-[var(--color-outline)] shrink-0">
                    {Math.round(d.confidence * 100)}% est.
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {caseState.possibleConditions.length > 1 && (
          <section className="space-y-3">
            <h3 className="font-headline text-lg font-bold text-[var(--color-on-surface)] px-1">
              Possible conditions
            </h3>
            <div className="flex flex-wrap gap-2">
              {caseState.possibleConditions.map((c) => (
                <span
                  key={c}
                  className="px-3 py-1.5 rounded-full bg-[var(--color-surface-container-highest)] text-sm font-semibold text-[var(--color-on-surface)]"
                >
                  {c}
                </span>
              ))}
            </div>
          </section>
        )}

        {caseState.supportingEvidence.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-headline text-lg font-bold text-[var(--color-on-surface)] px-1">
              Supporting evidence
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--color-on-surface-variant)]">
              {caseState.supportingEvidence.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </section>
        )}

        {caseState.knowledgeMatches.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-headline text-lg font-bold text-[var(--color-on-surface)] px-1">
              Knowledge base matches
            </h3>
            <ul className="space-y-3">
              {caseState.knowledgeMatches.slice(0, 6).map((k) => (
                <li key={k.condition_code} className="bg-[var(--color-surface-container-low)] rounded-lg p-4 text-sm">
                  <p className="font-bold text-[var(--color-on-surface)]">
                    {k.condition_name}{" "}
                    <span className="text-[var(--color-outline)] font-normal">({k.condition_code})</span>
                  </p>
                  {k.chunk_excerpt && (
                    <p className="text-[var(--color-on-surface-variant)] mt-2 leading-relaxed">{k.chunk_excerpt}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {caseState.treatments.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2 px-1">
              <h3 className="font-headline text-lg font-bold text-[var(--color-on-surface)]">Treatment plan</h3>
              <Link
                href={caseState.caseId ? `/treatment-options${caseQuery}` : "/treatment-options"}
                className="text-sm font-bold text-[var(--color-primary)] hover:underline"
              >
                Full list →
              </Link>
            </div>
            <p className="text-xs text-[var(--color-outline)] px-1">
              Structured options from the knowledge base — images and names when available. Confirm dosing and legality with a veterinarian.
            </p>
            <ul className="space-y-4">
              {caseState.treatments.slice(0, 5).map((t, idx) => (
                <li
                  key={`${t.drug_name}-${idx}-${t.generic_name ?? ""}-${t.dosage_text?.slice(0, 12) ?? ""}`}
                  className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)]/15 p-5 shadow-sm"
                >
                  <TreatmentRowDisplay t={normalizeTreatmentRow(t)} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {caseState.redFlags.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-headline text-lg font-bold text-[var(--color-error)] px-1">Red flags</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--color-on-surface-variant)]">
              {caseState.redFlags.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-col gap-3 pt-4">
          <Link
            href={caseState.caseId ? `/guided-inspection?case=${caseState.caseId}` : "/guided-inspection"}
            className="text-center font-semibold text-[var(--color-primary)] py-2 hover:underline"
          >
            Guided inspection checklist
          </Link>
          <Link href="/cases" className="text-center text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]">
            Back to all cases
          </Link>
        </div>
      </main>

      <BottomNavBar />
    </>
  );
}

export default function AnalysisResult() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-28 text-center text-[var(--color-on-surface-variant)]">Loading…</div>
      }
    >
      <AnalysisResultInner />
    </Suspense>
  );
}
