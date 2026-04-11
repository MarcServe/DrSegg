"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCase } from "@/context/CaseContext";
import BottomNavBar from "@/components/BottomNavBar";
import { AppLogo } from "@/components/AppLogo";
import { AnimalIcon, animalTypeToIconKey } from "@/components/AnimalIcon";

function FollowUpContent() {
  const searchParams = useSearchParams();
  const { caseState, setCaseId } = useCase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("improving");

  useEffect(() => {
    const c = searchParams.get("case");
    if (c && /^[0-9a-f-]{36}$/i.test(c) && c !== caseState.caseId) {
      setCaseId(c);
    }
  }, [searchParams, setCaseId, caseState.caseId]);

  const handleFollowUp = async () => {
    if (!caseState.caseId) {
      alert("Open this page from a case, or run a new analysis first.");
      return;
    }
    setIsSubmitting(true);
    try {
      await fetch("/api/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: caseState.caseId,
          status,
          notes: "Daily check-in via app",
        }),
      });
      alert("Follow-up recorded successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to record follow-up");
    } finally {
      setIsSubmitting(false);
    }
  };

  const caseHref = caseState.caseId ? `/case/${caseState.caseId}` : "/cases";
  const iconKey = caseState.animalType ? animalTypeToIconKey(caseState.animalType) : null;

  return (
    <>
      <header className="bg-[#f9faf6] dark:bg-stone-950 flex justify-between items-center px-6 py-4 w-full sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            href={caseHref}
            className="hover:bg-[#e2e3df] transition-colors p-2 rounded-full active:scale-95 duration-150"
          >
            <span className="material-symbols-outlined text-[#0f5238]">arrow_back</span>
          </Link>
          <AppLogo href="/cases" size={104} />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="hover:bg-[#e2e3df] transition-colors p-2 rounded-full active:scale-95 duration-150"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined text-[#0f5238]">settings</span>
          </Link>
        </div>
      </header>

      <main className="px-6 mt-6 max-w-4xl mx-auto space-y-8 pb-32">
        <Link href={caseHref} className="flex items-center gap-6 p-2 cursor-pointer active:scale-[0.99]">
          <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm relative bg-[var(--color-surface-container-highest)] flex items-center justify-center shrink-0">
            {iconKey ? (
              <AnimalIcon animal={iconKey} size={80} label={caseState.animalType || "Animal"} className="max-h-20" />
            ) : (
              <span className="material-symbols-outlined text-4xl text-[var(--color-primary)]">pets</span>
            )}
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-[var(--color-outline)] mb-1 block">
              {caseState.caseId ? `Case #${caseState.caseId.slice(0, 8)}` : "No case linked"}
            </span>
            <h2 className="text-2xl font-extrabold font-manrope text-[var(--color-primary)] tracking-tight capitalize">
              {caseState.animalType || "Animal"} —{" "}
              {caseState.possibleConditions[0] || "follow-up"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-3 h-3 bg-[var(--color-primary)] rounded-full" />
              <span className="text-sm font-semibold text-[var(--color-on-surface-variant)]">Follow-up check-in</span>
            </div>
          </div>
        </Link>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <button
            type="button"
            onClick={() => setStatus("improving")}
            className={`bg-[var(--color-surface-container-highest)] p-8 rounded-xl flex flex-col items-center gap-4 hover:bg-[var(--color-surface-variant)] transition-colors active:scale-95 group cursor-pointer ${
              status === "improving" ? "ring-4 ring-[var(--color-primary)]" : ""
            }`}
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl">trending_up</span>
            </div>
            <span className="text-lg font-bold font-manrope">Improving</span>
          </button>
          <button
            type="button"
            onClick={() => setStatus("worsening")}
            className={`bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] p-8 rounded-xl flex flex-col items-center gap-4 hover:opacity-90 transition-opacity active:scale-95 text-white group cursor-pointer ${
              status === "worsening" ? "ring-4 ring-red-500" : ""
            }`}
          >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-white text-3xl filled-icon">trending_down</span>
            </div>
            <span className="text-lg font-bold font-manrope">Worsening</span>
          </button>
        </section>

        <div className="mt-8 text-center pb-8">
          <button
            type="button"
            onClick={() => void handleFollowUp()}
            disabled={isSubmitting || !caseState.caseId}
            className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--color-primary)] text-white rounded-full shadow-2xl font-headline font-bold tracking-tight hover:opacity-90 active:scale-90 duration-150 disabled:opacity-50 cursor-pointer"
          >
            <span>{isSubmitting ? "Saving…" : "Submit follow-up"}</span>
            <span className="material-symbols-outlined">save</span>
          </button>
          {!caseState.caseId && (
            <p className="text-sm text-[var(--color-outline)] mt-4">
              Open this screen from a case (Cases → case) or complete a new analysis first.
            </p>
          )}
        </div>
      </main>

      <BottomNavBar />
    </>
  );
}

export default function FollowUp() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-28 text-center text-[var(--color-on-surface-variant)]">Loading…</div>
      }
    >
      <FollowUpContent />
    </Suspense>
  );
}
