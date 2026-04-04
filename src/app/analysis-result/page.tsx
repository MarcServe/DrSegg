"use client";

import Image from "next/image";
import Link from "next/link";
import { useCase } from "@/context/CaseContext";
import BottomNavBar from "@/components/BottomNavBar";

export default function AnalysisResult() {
  const { caseState } = useCase();

  // Fallback to mock if no real analysis is present
  const getDiagnosis = () => {
    if (caseState.possibleConditions && caseState.possibleConditions.length > 0) {
      const severityStr = caseState.severity || 'ORANGE (HIGH)';
      let severityColor = 'bg-[var(--color-tertiary)]';
      let severityText = 'text-[var(--color-on-tertiary)]';
      
      if (severityStr.includes('RED')) {
        severityColor = 'bg-[var(--color-error)]';
        severityText = 'text-[var(--color-on-error)]';
      } else if (severityStr.includes('YELLOW')) {
        severityColor = 'bg-yellow-500';
        severityText = 'text-white';
      }

      return {
        condition: caseState.possibleConditions[0],
        severity: severityStr,
        severityColor,
        severityText,
        description: 'Requires intervention to prevent permanent tissue damage.',
        confidence: caseState.confidence || 92,
      };
    }

    // Mocking the result based on animal type for demonstration
    if (caseState.animalType === 'poultry') {
      return {
        condition: 'Newcastle Disease',
        severity: 'RED (CRITICAL)',
        severityColor: 'bg-[var(--color-error)]',
        severityText: 'text-[var(--color-on-error)]',
        description: 'Requires immediate isolation to prevent flock spread.',
        confidence: 88,
      };
    }
    if (caseState.animalType === 'goat') {
      return {
        condition: 'Peste des Petits Ruminants (PPR)',
        severity: 'ORANGE (HIGH)',
        severityColor: 'bg-[var(--color-tertiary)]',
        severityText: 'text-[var(--color-on-tertiary)]',
        description: 'Requires intervention within 24 hours.',
        confidence: 85,
      };
    }
    
    // Default Pig
    return {
      condition: 'Swine Erysipelas',
      severity: 'ORANGE (HIGH)',
      severityColor: 'bg-[var(--color-tertiary)]',
      severityText: 'text-[var(--color-on-tertiary)]',
      description: 'Requires intervention within 24 hours to prevent permanent tissue damage.',
      confidence: 92,
    };
  };

  const diagnosis = getDiagnosis();

  return (
    <>
      {/* Top App Bar */}
      <header className="bg-[#f9faf6] dark:bg-stone-950 flex justify-between items-center px-6 py-4 w-full sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/guided-inspection" className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors p-2 rounded-full active:scale-95 duration-150">
            arrow_back
          </Link>
          <h1 className="text-[#0f5238] dark:text-emerald-400 font-manrope font-extrabold text-xl">
            Dr Segg
          </h1>
        </div>
        <button className="material-symbols-outlined text-[#414941] dark:text-stone-400 hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors p-2 rounded-full active:scale-95 duration-150">
          settings
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8 pb-32">
        {/* Hero Analysis Result */}
        <section className="bg-[var(--color-surface-container-lowest)] p-8 rounded-xl shadow-[0px_12px_32px_rgba(44,105,78,0.08)] space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-sm font-bold text-[var(--color-primary)] bg-[var(--color-primary-fixed)] px-4 py-1 rounded-full uppercase tracking-widest">
                Analysis Complete
              </span>
              <h2 className="font-headline text-4xl text-[var(--color-primary)] font-extrabold mt-4 leading-tight">
                {diagnosis.condition}
              </h2>
            </div>
            <div className="bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] p-4 rounded-xl text-center min-w-[80px]">
              <div className="text-2xl font-extrabold">{diagnosis.confidence}%</div>
              <div className="text-[10px] uppercase font-bold tracking-tighter">Confidence</div>
            </div>
          </div>

          {/* Severity Scale */}
          <div className="bg-[var(--color-surface-container-low)] p-6 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-headline font-bold text-[var(--color-on-surface)]">Severity Level</span>
              <span className={`font-extrabold px-3 py-1 rounded-full text-sm ${diagnosis.severityColor} ${diagnosis.severityText}`}>
                {diagnosis.severity}
              </span>
            </div>
            <div className="flex h-3 w-full gap-2">
              <div className="flex-1 rounded-full bg-[var(--color-primary)] h-full"></div>
              <div className="flex-1 rounded-full bg-yellow-500 h-full"></div>
              <div className="flex-1 rounded-full bg-[var(--color-tertiary-container)] h-full"></div>
              <div className="flex-1 rounded-full bg-[var(--color-surface-container-highest)] h-full"></div>
            </div>
            <p className="text-sm text-[var(--color-on-surface-variant)] italic">
              {diagnosis.description}
            </p>
          </div>
        </section>

        {/* Why this might be the case */}
        <section className="space-y-4">
          <h3 className="font-headline text-xl font-bold text-[var(--color-on-surface)] px-2">
            Clinical Observations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[var(--color-surface-container-high)] p-6 rounded-lg flex items-center gap-4">
              <span className="material-symbols-outlined text-[var(--color-tertiary)] text-3xl">thermometer</span>
              <div>
                <div className="font-bold text-[var(--color-on-surface)]">Elevated Temp</div>
                <div className="text-sm text-[var(--color-on-surface-variant)]">104.2°F Detected</div>
              </div>
            </div>
            <div className="bg-[var(--color-surface-container-high)] p-6 rounded-lg flex items-center gap-4">
              <span className="material-symbols-outlined text-[var(--color-tertiary)] text-3xl">potted_plant</span>
              <div>
                <div className="font-bold text-[var(--color-on-surface)]">Pasture Factor</div>
                <div className="text-sm text-[var(--color-on-surface-variant)]">Wet lowland conditions</div>
              </div>
            </div>
            <div className="bg-[var(--color-surface-container-high)] p-6 rounded-lg flex items-center gap-4">
              <span className="material-symbols-outlined text-[var(--color-tertiary)] text-3xl">footprint</span>
              <div>
                <div className="font-bold text-[var(--color-on-surface)]">Limb Swelling</div>
                <div className="text-sm text-[var(--color-on-surface-variant)]">Interdigital inflammation</div>
              </div>
            </div>
            <div className="bg-[var(--color-surface-container-high)] p-6 rounded-lg flex items-center gap-4">
              <span className="material-symbols-outlined text-[var(--color-tertiary)] text-3xl">monitor_weight</span>
              <div>
                <div className="font-bold text-[var(--color-on-surface)]">Weight Loss</div>
                <div className="text-sm text-[var(--color-on-surface-variant)]">Decreased grazing pattern</div>
              </div>
            </div>
          </div>
        </section>

        {/* Action Image */}
        <div className="w-full h-48 rounded-xl overflow-hidden shadow-sm relative">
          <Image
            alt="Vet examining hoof"
            className="object-cover"
            fill
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjex3HGZcmm8xIm8E9iUpN6nuh4nYBKcK0MUc6TwNlFIe2aslaPdkhmSqEQV8tb3bQARnLFVneNcWYY3VUhJIsikWLmK9c6AZRsUa3If14xdewYk_zQMrMFFfuIbuCdwxalfIwZmzgzs4N1e5nULG9tY32LlBolq0O3GEsvY4OfFDlX9xnhP_Y_2FXvUhgdjLeaHhaYtolMzXPA2-03WwaiXe9XhJPhDEYiLxe96rwiXhOcuS8qEBJLAOtHhrtdFMYSOekV6LpPSo"
          />
        </div>

        {/* What to do now */}
        <section className="space-y-6">
          <h3 className="font-headline text-xl font-bold text-[var(--color-on-surface)] px-2">
            Immediate Protocol
          </h3>
          <div className="space-y-4">
            <Link href="/treatment-options" className="w-full bg-gradient-to-r from-[#0f5238] to-[#2d6a4f] text-white py-6 px-8 rounded-xl flex items-center justify-between shadow-[0px_12px_32px_rgba(44,105,78,0.15)] active:scale-95 transition-all">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-3xl">vaccines</span>
                <div className="text-left">
                  <div className="font-bold text-lg">Administer Antibiotics</div>
                  <div className="text-sm opacity-90">Penicillin 20mg/kg recommended</div>
                </div>
              </div>
              <span className="material-symbols-outlined">chevron_right</span>
            </Link>
            <button className="w-full bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] py-6 px-8 rounded-xl flex items-center justify-between active:scale-95 transition-all">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-3xl text-[var(--color-primary)]">call</span>
                <div className="text-left">
                  <div className="font-bold text-lg">Contact Local Vet</div>
                  <div className="text-sm text-[var(--color-on-surface-variant)]">Schedule house call for herd check</div>
                </div>
              </div>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <button className="w-full border-2 border-[var(--color-primary)]/20 text-[var(--color-primary)] py-4 px-8 rounded-xl font-bold flex items-center justify-center gap-2 active:bg-[var(--color-primary)]/5">
              <span className="material-symbols-outlined">description</span>
              Log to Animal Records
            </button>
          </div>
        </section>
      </main>

      <BottomNavBar />
    </>
  );
}
