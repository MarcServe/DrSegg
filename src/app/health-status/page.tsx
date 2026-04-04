"use client";

import Link from "next/link";
import { useCase } from "@/context/CaseContext";
import BottomNavBar from "@/components/BottomNavBar";

export default function HealthStatus() {
  const { caseState } = useCase();

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
          <h1 className="text-[#0f5238] dark:text-emerald-400 font-manrope font-extrabold text-xl">
            Dr Segg
          </h1>
        </div>
        <button className="text-[#0f5238] dark:text-emerald-500 hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors p-2 rounded-full active:scale-95 duration-150">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Status Badge Hero Section */}
        <section className="relative overflow-hidden rounded-xl bg-[var(--color-surface-container-lowest)] p-8 text-center space-y-4">
          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full font-headline font-bold text-lg ${config.color}`}>
            <span className="material-symbols-outlined filled-icon">{config.icon}</span>
            {config.label}
          </div>
          <div className="space-y-1">
            <p className="text-[var(--color-on-surface-variant)] font-medium">Animal ID: #8829 - &quot;Bessie&quot;</p>
            <h2 className="text-3xl font-headline font-extrabold text-[var(--color-on-surface)]">
              {config.title}
            </h2>
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
        </section>

        {/* Bento Grid Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* What I See */}
          <section className="bg-[var(--color-surface-container-low)] rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center text-[var(--color-on-primary-container)]">
                <span className="material-symbols-outlined">visibility</span>
              </div>
              <h3 className="font-headline font-bold text-lg">What I See</h3>
            </div>
            <p className="text-[var(--color-on-surface)] font-medium leading-relaxed">
              {config.description}
            </p>
          </section>

          {/* What You Reported */}
          <section className="bg-[var(--color-surface-container-low)] rounded-lg p-6 space-y-4">
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
          </section>
        </div>

        {/* Monitoring Checklist */}
        <section className="bg-[var(--color-surface-container-lowest)] rounded-xl p-8 space-y-6">
          <h3 className="font-headline font-extrabold text-xl text-[var(--color-on-surface)] flex items-center gap-2">
            Monitoring Checklist
          </h3>
          <div className="space-y-4">
            {/* Checklist Item 1 */}
            <div className="flex items-center justify-between p-4 bg-[var(--color-surface-container-low)] rounded-lg">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[var(--color-primary)] filled-icon">restaurant</span>
                <span className="font-bold text-[var(--color-on-surface)]">Eating Habits</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-primary)] font-bold">check</span>
            </div>
            {/* Checklist Item 2 */}
            <div className="flex items-center justify-between p-4 bg-[var(--color-surface-container-low)] rounded-lg">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[var(--color-primary)] filled-icon">water_drop</span>
                <span className="font-bold text-[var(--color-on-surface)]">Drinking Water</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-primary)] font-bold">check</span>
            </div>
            {/* Checklist Item 3 */}
            <div className="flex items-center justify-between p-4 bg-[var(--color-surface-container-low)] rounded-lg">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[var(--color-primary)] filled-icon">directions_run</span>
                <span className="font-bold text-[var(--color-on-surface)]">Active Movement</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-primary)] font-bold">check</span>
            </div>
          </div>
        </section>

        {/* Action Button */}
        <div className="pt-4 pb-10">
          <Link href="/guided-inspection" className="w-full h-14 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-container)] text-[var(--color-on-primary)] font-headline font-bold text-lg rounded-full shadow-[0px_12px_32px_rgba(44,105,78,0.2)] active:scale-95 transition-transform flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">update</span>
            Check Again Later
          </Link>
          <div className="text-center mt-4">
            <Link href="/guided-inspection" className="text-[var(--color-on-surface-variant)] text-sm underline">
              Or proceed to Guided Inspection
            </Link>
          </div>
        </div>
      </main>

      <BottomNavBar />
    </>
  );
}
