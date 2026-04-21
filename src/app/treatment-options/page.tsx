"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCase } from "@/context/CaseContext";
import BottomNavBar from "@/components/BottomNavBar";
import { AppLogo } from "@/components/AppLogo";
import { TreatmentRowDisplay } from "@/components/TreatmentRowDisplay";
import type { TreatmentRow } from "@/lib/ai/treatments";

function TreatmentCard({ t, followUpHref }: { t: TreatmentRow; followUpHref: string }) {
  return (
    <Link
      href={followUpHref}
      className="block bg-[var(--color-surface-container-lowest)] rounded-xl p-6 shadow-sm border border-[var(--color-outline-variant)]/15 hover:bg-[var(--color-surface-container-low)] active:scale-[0.99] transition-all"
    >
      <TreatmentRowDisplay t={t} />
    </Link>
  );
}

function TreatmentOptionsInner() {
  const searchParams = useSearchParams();
  const { caseState, setCaseId } = useCase();
  const [treatments, setTreatments] = useState<TreatmentRow[]>([]);
  const [apiWarnings, setApiWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const followUpHref = caseState.caseId ? `/follow-up?case=${caseState.caseId}` : "/follow-up";
  const backHref = caseState.caseId ? `/case/${caseState.caseId}` : "/analysis-result";

  useEffect(() => {
    const c = searchParams.get("case");
    if (c && /^[0-9a-f-]{36}$/i.test(c) && c !== caseState.caseId) {
      setCaseId(c);
    }
  }, [searchParams, setCaseId, caseState.caseId]);

  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const conditionCode = caseState.knowledgeMatches[0]?.condition_code;
        const response = await fetch("/api/treatment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            region: caseState.region,
            condition: caseState.possibleConditions[0] || "",
            condition_code: conditionCode || undefined,
            species: caseState.animalType || "poultry",
            caseId: caseState.caseId,
          }),
        });
        const data = await response.json();
        const raw = (data.treatments || []) as TreatmentRow[];
        setTreatments(raw);
        setApiWarnings(data.warnings || []);
      } catch (error) {
        console.error("Failed to fetch treatments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTreatments();
  }, [caseState]);

  return (
    <>
      <header className="flex justify-between items-center px-6 py-4 w-full bg-[#f9faf6] dark:bg-stone-950 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href={backHref} className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 cursor-pointer active:scale-95 duration-150">
            arrow_back
          </Link>
          <AppLogo href="/cases" size={104} />
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 cursor-pointer active:scale-95 duration-150 hover:bg-[#e2e3df] dark:hover:bg-stone-800 rounded-full p-2"
            aria-label="Settings"
          >
            settings
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-8 pb-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex-1">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 bg-[var(--color-primary-container)]/10 px-4 py-1.5 rounded-full text-[var(--color-primary)] mb-4 cursor-pointer hover:opacity-90 active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-sm filled-icon">location_on</span>
              <span className="font-label text-sm font-bold uppercase tracking-wider">{caseState.region}</span>
            </Link>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
              Treatment options
            </h1>
            {caseState.possibleConditions[0] ? (
              <p className="mt-2 text-[var(--color-on-surface-variant)]">
                Matched condition context:{" "}
                <span className="font-semibold text-[var(--color-on-surface)]">{caseState.possibleConditions[0]}</span>
              </p>
            ) : null}
          </div>
          <Link
            href="/profile#region"
            className="flex items-center gap-2 bg-[var(--color-surface-container-highest)] px-6 py-4 rounded-xl hover:bg-[#e2e3df] transition-colors active:scale-95 duration-150 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[var(--color-primary)]">distance</span>
            <span className="font-label font-bold text-[var(--color-on-surface-variant)]">Change region</span>
          </Link>
        </div>

        {apiWarnings.length > 0 && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-[var(--color-on-surface)]">
            {apiWarnings.join(" ")}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        ) : treatments.length === 0 ? (
          <div className="rounded-xl border border-[var(--color-outline-variant)]/20 bg-[var(--color-surface-container-low)] dark:bg-stone-900/40 p-8 text-center">
            <span className="material-symbols-outlined text-5xl text-[var(--color-outline)]">medication_liquid</span>
            <p className="mt-4 font-headline text-lg font-bold text-[var(--color-on-surface)]">No structured treatments in the database for this lookup</p>
            <p className="mt-2 text-sm text-[var(--color-on-surface-variant)] max-w-md mx-auto">
              Run an analysis so we can match a condition, or start a new case with symptoms and media. Set your region in profile so we can flag which products are more likely to be available locally.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/analysis-result"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white"
              >
                View analysis
              </Link>
              <Link href="/new-case" className="inline-flex items-center gap-2 rounded-full border border-[var(--color-outline-variant)] px-5 py-2.5 text-sm font-bold">
                New case
              </Link>
              <Link href="/profile#region" className="inline-flex items-center gap-2 rounded-full border border-[var(--color-outline-variant)] px-5 py-2.5 text-sm font-bold">
                Region settings
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {treatments.map((t) => (
              <TreatmentCard key={`${t.drug_name}-${t.generic_name ?? ""}-${t.dosage_text ?? ""}`} t={t} followUpHref={followUpHref} />
            ))}
          </div>
        )}

        {treatments.length > 0 && (
          <div className="mt-12 text-center">
            <Link
              href={followUpHref}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--color-primary)] text-white rounded-full shadow-2xl font-headline font-bold tracking-tight hover:opacity-90 active:scale-90 duration-150"
            >
              <span>Start treatment & track progress</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        )}
      </main>

      <BottomNavBar />
    </>
  );
}

export default function TreatmentOptions() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-28 text-center text-[var(--color-on-surface-variant)]">Loading…</div>
      }
    >
      <TreatmentOptionsInner />
    </Suspense>
  );
}
