"use client";

import Link from "next/link";
import { useCase } from "@/context/CaseContext";
import BottomNavBar from "@/components/BottomNavBar";
import { AppLogo } from "@/components/AppLogo";
import { AnimalIcon, animalTypeToIconKey } from "@/components/AnimalIcon";

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

export default function AnalysisResult() {
  const { caseState } = useCase();

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
      : "Run a new analysis from New case, or open a saved case from Cases for full details.");

  const confidence = caseState.confidence || 0;

  const iconKey = caseState.animalType ? animalTypeToIconKey(caseState.animalType) : null;

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
        <div className="bg-[var(--color-surface-container-lowest)] p-8 rounded-xl shadow-[0px_12px_32px_rgba(44,105,78,0.08)] space-y-6">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <span className="text-sm font-bold text-[var(--color-primary)] bg-[var(--color-primary-fixed)] px-4 py-1 rounded-full uppercase tracking-widest">
                Analysis complete
              </span>
              <h2 className="font-headline text-3xl sm:text-4xl text-[var(--color-primary)] font-extrabold mt-4 leading-tight break-words">
                {primaryCondition}
              </h2>
              {caseState.modelUsed && (
                <p className="text-xs text-[var(--color-outline)] mt-2">Model: {caseState.modelUsed}</p>
              )}
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
              href="/treatment-options"
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
            <Link
              href={`/records?case=${caseState.caseId}`}
              className="block text-center text-sm font-semibold text-[var(--color-primary)] underline underline-offset-2"
            >
              Attach documents to this case
            </Link>
          )}
        </div>

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
              <h3 className="font-headline text-lg font-bold text-[var(--color-on-surface)]">
                Structured treatment snapshot
              </h3>
              <Link href="/treatment-options" className="text-sm font-bold text-[var(--color-primary)] hover:underline">
                Details →
              </Link>
            </div>
            <p className="text-xs text-[var(--color-outline)] px-1">
              From your region-matched database rows. Confirm dosing and legality with a veterinarian.
            </p>
            <ul className="space-y-2">
              {caseState.treatments.slice(0, 5).map((t) => (
                <li key={t.drug_name} className="bg-[var(--color-surface-container-low)] rounded-lg p-4">
                  <p className="font-bold text-[var(--color-on-surface)]">{t.drug_name}</p>
                  {t.generic_name && (
                    <p className="text-sm text-[var(--color-on-surface-variant)]">Active: {t.generic_name}</p>
                  )}
                  {t.dosage_text && <p className="text-sm mt-1 text-[var(--color-on-surface)]">{t.dosage_text}</p>}
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
            href="/guided-inspection"
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
