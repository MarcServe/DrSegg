"use client";

import Link from "next/link";
import { useCase } from "@/context/CaseContext";
import BottomNavBar from "@/components/BottomNavBar";
import { AppLogo } from "@/components/AppLogo";

export default function HealthStatus() {
  const { caseState } = useCase();
  const analysisHref = caseState.caseId ? `/analysis-result?case=${caseState.caseId}` : "/analysis-result";
  const treatmentHref = caseState.caseId ? `/treatment-options?case=${caseState.caseId}` : "/treatment-options";
  const guidedHref = caseState.caseId ? `/guided-inspection?case=${caseState.caseId}` : "/guided-inspection";

  // Helper to determine UI based on health status
  const getStatusConfig = () => {
    switch (caseState.healthStatus) {
      case "healthy":
        return {
          icon: "check_circle",
          color: "bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed)]",
          label: "Healthy",
          title: "No strong signs of illness detected",
          description: `The ${caseState.animalType || 'animal'}'s movement patterns and posture indicate optimal muscle tone and zero respiratory distress.`,
        };
      case "mild_concern":
        return {
          icon: "info",
          color: "bg-yellow-200 text-yellow-900",
          label: "Monitor",
          title: "Mild signs of concern detected",
          description: `There are mild signs that may indicate early stress or illness in the ${caseState.animalType || 'animal'}.`,
        };
      case "likely_sick":
        return {
          icon: "warning",
          color: "bg-orange-200 text-orange-900",
          label: "Needs Attention",
          title: "Potential illness detected",
          description: `The ${caseState.animalType || 'animal'} is showing clear signs of illness that require further inspection.`,
        };
      case "critical":
        return {
          icon: "emergency",
          color: "bg-[var(--color-error-container)] text-[var(--color-on-error-container)]",
          label: "Critical",
          title: "Critical condition detected",
          description: `The ${caseState.animalType || 'animal'} is showing severe signs. Contact a veterinarian immediately.`,
        };
      default:
        return {
          icon: "help",
          color: "bg-gray-200 text-gray-900",
          label: "Unknown",
          title: "Analysis incomplete",
          description: "Please provide more information.",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <>
      {/* TopAppBar */}
      <header className="bg-[#f9faf6] dark:bg-stone-950 flex justify-between items-center px-6 py-4 w-full sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/new-case" className="text-[#0f5238] dark:text-emerald-500 hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors p-2 rounded-full active:scale-95 duration-150">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <AppLogo href="/cases" size={104} />
        </div>
        <Link
          href="/profile"
          className="text-[#0f5238] dark:text-emerald-500 hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors p-2 rounded-full active:scale-95 duration-150"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined">settings</span>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Status Badge Hero Section */}
        <Link href={analysisHref} className="relative overflow-hidden rounded-xl bg-[var(--color-surface-container-lowest)] p-8 text-center space-y-4 block cursor-pointer hover:bg-[var(--color-surface-container-low)] transition-colors active:scale-[0.99]">
          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full font-headline font-bold text-lg ${config.color}`}>
            <span className="material-symbols-outlined filled-icon">{config.icon}</span>
            {config.label}
          </div>
          <div className="space-y-1">
            <p className="text-[var(--color-on-surface-variant)] font-medium">
              {caseState.animalType ? caseState.animalType.charAt(0).toUpperCase() + caseState.animalType.slice(1) : "Animal"}{" "}
              case
            </p>
            <h2 className="text-3xl font-headline font-extrabold text-[var(--color-on-surface)]">
              {config.title}
            </h2>
            {caseState.summary && (
              <p className="text-sm text-left text-[var(--color-on-surface-variant)] pt-2 max-w-prose mx-auto leading-relaxed">
                {caseState.summary}
              </p>
            )}
          </div>
          {/* Confidence Level Indicator */}
          <div className="pt-4 space-y-2 max-w-xs mx-auto">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[var(--color-outline)]">
              <span>AI Confidence</span>
              <span>{caseState.confidence}%</span>
            </div>
            <div className="h-3 w-full bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${caseState.confidence}%` }}></div>
            </div>
          </div>
        </Link>

        {caseState.escalationSuggested && (
          <div className="rounded-xl border border-[var(--color-error)] bg-[var(--color-error-container)]/30 px-4 py-3 text-sm text-[var(--color-on-error-container)]">
            <span className="font-headline font-bold block mb-1">Escalate to a veterinarian</span>
            Signs or risk level suggest prompt professional assessment. This app does not replace an exam.
          </div>
        )}

        {caseState.needsMoreInfo && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-[var(--color-on-surface)]">
            <span className="font-headline font-bold block mb-1">More information helps</span>
            {caseState.suggestedNextChecks.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {caseState.suggestedNextChecks.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p>Add detail, timeline, or clear photos/video on a new case run.</p>
            )}
          </div>
        )}

        {caseState.redFlags.length > 0 && (
          <div className="rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-4 py-3 text-sm">
            <span className="font-bold text-[var(--color-on-surface)] block mb-1">Flags to discuss with a vet</span>
            <ul className="list-disc pl-5 space-y-1 text-[var(--color-on-surface-variant)]">
              {caseState.redFlags.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {caseState.assessmentDisclaimer && (
          <p className="text-xs text-[var(--color-outline)] text-center px-2">{caseState.assessmentDisclaimer}</p>
        )}

        {caseState.caseId && (
          <section className="rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4 space-y-3">
            <p className="font-headline font-bold text-[var(--color-on-surface)]">Analysis saved</p>
            <p className="text-sm text-[var(--color-on-surface-variant)]">
              This case is stored in your account. Use the links below for the full write-up, treatments, and documents.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href={`/case/${caseState.caseId}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] text-white font-headline font-bold py-3 px-4 hover:opacity-95 active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-xl">folder_open</span>
                View case file
              </Link>
              <Link
                href={analysisHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-bold py-3 px-4 hover:bg-[var(--color-primary)]/5"
              >
                <span className="material-symbols-outlined text-xl">analytics</span>
                Full analysis &amp; differentials
              </Link>
              <Link
                href={treatmentHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] font-bold py-3 px-4 hover:opacity-95"
              >
                <span className="material-symbols-outlined text-xl">vaccines</span>
                Treatment options (from database)
              </Link>
              <Link
                href={`/follow-up?case=${caseState.caseId}`}
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[var(--color-on-surface-variant)] py-2 underline underline-offset-2"
              >
                Add follow-up notes
              </Link>
              <Link
                href={`/records?case=${caseState.caseId}`}
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[var(--color-primary)] py-2 underline underline-offset-2"
              >
                Attach farm record to this case
              </Link>
              <Link href="/cases" className="text-center text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]">
                See all cases →
              </Link>
            </div>
          </section>
        )}

        {/* Bento Grid Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* What I See */}
          <Link
            href={analysisHref}
            className="bg-[var(--color-surface-container-low)] rounded-lg p-6 space-y-4 block cursor-pointer hover:bg-[var(--color-surface-container-high)] transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center text-[var(--color-on-primary-container)]">
                <span className="material-symbols-outlined">visibility</span>
              </div>
              <h3 className="font-headline font-bold text-lg">What I See</h3>
            </div>
            <p className="text-[var(--color-on-surface)] font-medium leading-relaxed">
              {config.description}
            </p>
          </Link>

          {/* What You Reported */}
          <Link
            href="/new-case"
            className="bg-[var(--color-surface-container-low)] rounded-lg p-6 space-y-4 block cursor-pointer hover:bg-[var(--color-surface-container-high)] transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-secondary-container)] flex items-center justify-center text-[var(--color-on-secondary-container)]">
                <span className="material-symbols-outlined">edit_note</span>
              </div>
              <h3 className="font-headline font-bold text-lg">What You Reported</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {caseState.symptoms.length > 0 ? (
                caseState.symptoms.map((symptom, idx) => (
                  <span key={idx} className="px-3 py-1 bg-[var(--color-surface-container-highest)] rounded-full text-sm font-semibold capitalize">
                    {symptom}
                  </span>
                ))
              ) : (
                <span className="px-3 py-1 bg-[var(--color-surface-container-highest)] rounded-full text-sm font-semibold">No symptoms reported</span>
              )}
            </div>
          </Link>
        </div>

        {/* Monitoring Checklist */}
        <section className="bg-[var(--color-surface-container-lowest)] rounded-xl p-8 space-y-6">
          <Link href={guidedHref} className="font-headline font-extrabold text-xl text-[var(--color-on-surface)] flex items-center gap-2 cursor-pointer hover:text-[var(--color-primary)] w-fit">
            Monitoring Checklist
          </Link>
          <div className="space-y-4">
            <Link
              href={guidedHref}
              className="w-full flex items-center justify-between p-4 bg-[var(--color-surface-container-low)] rounded-lg cursor-pointer hover:bg-[var(--color-surface-container-high)] text-left active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[var(--color-primary)] filled-icon">restaurant</span>
                <span className="font-bold text-[var(--color-on-surface)]">Eating habits</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline)] text-sm">chevron_right</span>
            </Link>
            <Link
              href={guidedHref}
              className="w-full flex items-center justify-between p-4 bg-[var(--color-surface-container-low)] rounded-lg cursor-pointer hover:bg-[var(--color-surface-container-high)] text-left active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[var(--color-primary)] filled-icon">water_drop</span>
                <span className="font-bold text-[var(--color-on-surface)]">Drinking water</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline)] text-sm">chevron_right</span>
            </Link>
            <Link
              href={guidedHref}
              className="w-full flex items-center justify-between p-4 bg-[var(--color-surface-container-low)] rounded-lg cursor-pointer hover:bg-[var(--color-surface-container-high)] text-left active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[var(--color-primary)] filled-icon">directions_run</span>
                <span className="font-bold text-[var(--color-on-surface)]">Log movement / behavior</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline)] text-sm">chevron_right</span>
            </Link>
          </div>
        </section>

        {/* Action Button */}
        <div className="pt-4 pb-10">
          <Link href={guidedHref} className="w-full h-14 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-container)] text-[var(--color-on-primary)] font-headline font-bold text-lg rounded-full shadow-[0px_12px_32px_rgba(44,105,78,0.2)] active:scale-95 transition-transform flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">update</span>
            Check Again Later
          </Link>
          <div className="text-center mt-4">
            <Link href={guidedHref} className="text-[var(--color-on-surface-variant)] text-sm underline">
              Or proceed to Guided Inspection
            </Link>
          </div>
        </div>
      </main>

      <BottomNavBar />
    </>
  );
}
