"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCase } from "@/context/CaseContext";
import { GiChicken, GiGoat, GiPig } from "react-icons/gi";

export default function NewCase() {
  const router = useRouter();
  const { caseState, setAnimalType, setHealthStatus, setAnalysisResult, setCaseId } = useCase();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const getButtonClasses = (animal: string) => {
    const isActive = caseState.animalType === animal;
    return isActive
      ? "group flex flex-col items-center justify-center aspect-square bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] transition-all rounded-xl p-4 active:scale-95 duration-150 shadow-lg shadow-[var(--color-primary-container)]/20"
      : "group flex flex-col items-center justify-center aspect-square bg-[var(--color-surface-container-low)] hover:bg-[var(--color-surface-container-highest)] transition-all rounded-xl p-4 active:scale-95 duration-150 border-2 border-transparent focus:border-[var(--color-primary)]";
  };

  const getIconClasses = (animal: string) => {
    const isActive = caseState.animalType === animal;
    return isActive
      ? "w-16 h-16 mb-4 flex items-center justify-center bg-[var(--color-primary)] rounded-full text-white scale-110"
      : "w-16 h-16 mb-4 flex items-center justify-center bg-[var(--color-surface-container-lowest)] rounded-full text-[var(--color-primary)] group-hover:scale-110 transition-transform";
  };

  const handleAnalyze = async () => {
    if (!caseState.animalType) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          animal: caseState.animalType, 
          // Sending a mock symptom for demonstration purposes
          symptoms: ['lethargy'] 
        })
      });
      const data = await response.json();
      
      // Update context with the result
      setCaseId(data.case_id);
      setHealthStatus(data.health_status, data.confidence);
      if (data.possible_conditions) {
        setAnalysisResult(data.possible_conditions, data.severity);
      }
      
      // Navigate to the health status screen
      router.push('/health-status');
    } catch (error) {
      console.error("Failed to analyze case:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <header className="flex justify-between items-center px-6 py-4 w-full bg-[#f9faf6] dark:bg-stone-950 fixed top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 text-[#0f5238] dark:text-emerald-500 hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors rounded-full active:scale-95 duration-150">
            <span className="material-symbols-outlined">close</span>
          </Link>
          <h1 className="font-manrope text-xl font-bold tracking-tight text-[#0f5238] dark:text-emerald-500">
            New Case
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-[#0f5238] dark:text-emerald-500 hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors rounded-full active:scale-95 duration-150">
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-12">
        {/* Step 1: Animal Selection */}
        <section className="space-y-6">
          <header className="space-y-1">
            <span className="font-label text-xs uppercase tracking-[0.2em] text-[var(--color-outline)] font-bold">
              Step 01
            </span>
            <h2 className="font-headline text-3xl font-extrabold text-[var(--color-on-surface)]">
              Select Patient
            </h2>
          </header>
          <div className="grid grid-cols-3 gap-4">
            {/* Poultry Selection */}
            <button 
              onClick={() => setAnimalType('poultry')}
              className={getButtonClasses('poultry')}
            >
              <div className={getIconClasses('poultry')}>
                <GiChicken size={36} className={caseState.animalType === 'poultry' ? 'drop-shadow-md' : ''} />
              </div>
              <span className={`font-headline font-bold ${caseState.animalType === 'poultry' ? '' : 'text-[var(--color-on-surface-variant)]'}`}>Poultry</span>
            </button>
            {/* Goat Selection */}
            <button 
              onClick={() => setAnimalType('goat')}
              className={getButtonClasses('goat')}
            >
              <div className={getIconClasses('goat')}>
                <GiGoat size={36} className={caseState.animalType === 'goat' ? 'drop-shadow-md' : ''} />
              </div>
              <span className={`font-headline font-bold ${caseState.animalType === 'goat' ? '' : 'text-[var(--color-on-surface-variant)]'}`}>Goat</span>
            </button>
            {/* Pig Selection */}
            <button 
              onClick={() => setAnimalType('pig')}
              className={getButtonClasses('pig')}
            >
              <div className={getIconClasses('pig')}>
                <GiPig size={36} className={caseState.animalType === 'pig' ? 'drop-shadow-md' : ''} />
              </div>
              <span className={`font-headline font-bold ${caseState.animalType === 'pig' ? '' : 'text-[var(--color-on-surface-variant)]'}`}>Pig</span>
            </button>
          </div>
        </section>

        {/* Step 2: Input Selection */}
        <section className="space-y-6">
          <header className="space-y-1">
            <span className="font-label text-xs uppercase tracking-[0.2em] text-[var(--color-outline)] font-bold">
              Step 02
            </span>
            <h2 className="font-headline text-3xl font-extrabold text-[var(--color-on-surface)]">
              Gather Details
            </h2>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Record Video */}
            <button className="flex items-center gap-6 p-8 bg-[var(--color-surface-container-lowest)] rounded-xl hover:bg-[var(--color-surface-container-low)] transition-colors text-left active:scale-[0.98] duration-150 border-2 border-transparent focus:border-[var(--color-primary)]">
              <div className="w-16 h-16 flex-shrink-0 bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">videocam</span>
              </div>
              <div>
                <span className="block font-headline text-xl font-bold">Record Video</span>
                <span className="font-body text-sm text-[var(--color-outline)]">Capture symptoms live</span>
              </div>
            </button>
            {/* Upload Image */}
            <button className="flex items-center gap-6 p-8 bg-[var(--color-surface-container-lowest)] rounded-xl hover:bg-[var(--color-surface-container-low)] transition-colors text-left active:scale-[0.98] duration-150 border-2 border-transparent focus:border-[var(--color-primary)]">
              <div className="w-16 h-16 flex-shrink-0 bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">photo_camera</span>
              </div>
              <div>
                <span className="block font-headline text-xl font-bold">Upload Image</span>
                <span className="font-body text-sm text-[var(--color-outline)]">Take or pick photos</span>
              </div>
            </button>
            {/* Speak Symptoms (Primary Voice Action) */}
            <button className="md:col-span-2 flex items-center justify-center gap-6 p-10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white rounded-xl active:scale-[0.98] duration-150 shadow-xl shadow-[var(--color-primary)]/20 group overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="relative z-10 w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-5xl filled-icon">mic</span>
              </div>
              <div className="relative z-10">
                <span className="block font-headline text-2xl font-extrabold tracking-tight">
                  Speak Symptoms
                </span>
                <span className="font-body text-[var(--color-primary-fixed)]/80 font-medium">
                  Quickest way to report
                </span>
              </div>
            </button>
            {/* Type Symptoms (Secondary Action) */}
            <button className="md:col-span-2 flex items-center justify-center gap-4 py-6 bg-[var(--color-surface-container-high)] rounded-xl text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-highest)] transition-colors active:scale-[0.98] duration-150">
              <span className="material-symbols-outlined text-2xl">keyboard</span>
              <span className="font-headline font-bold">Type Symptoms Instead</span>
            </button>
          </div>
        </section>

        {/* Aesthetic Bento-ish Context Hint */}
        <div className="grid grid-cols-1 gap-4 mt-8 opacity-60">
          <div className="flex items-center gap-4 p-4 bg-[var(--color-surface-container-low)] rounded-lg">
            <span className="material-symbols-outlined text-[var(--color-primary)]">auto_awesome</span>
            <p className="font-body text-sm text-[var(--color-on-surface-variant)] font-medium">
              AI Diagnostic engine is ready for Cow cases.
            </p>
          </div>
        </div>
      </main>

      {/* Floating Action: Complete */}
      <div className="fixed bottom-8 left-0 w-full flex justify-center z-50">
        <button 
          onClick={handleAnalyze}
          disabled={!caseState.animalType || isAnalyzing}
          className={`flex items-center gap-3 px-8 py-4 bg-[var(--color-primary)] text-white rounded-full shadow-2xl font-headline font-bold tracking-tight hover:opacity-90 active:scale-90 duration-150 ${(!caseState.animalType || isAnalyzing) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Case'}</span>
          <span className="material-symbols-outlined">
            {isAnalyzing ? 'hourglass_empty' : 'arrow_forward'}
          </span>
        </button>
      </div>

      {/* Decorative Organic Element */}
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-[var(--color-primary)]/5 rounded-full blur-[100px] pointer-events-none z-[-1]"></div>
      <div className="fixed -top-24 -left-24 w-64 h-64 bg-[var(--color-tertiary)]/5 rounded-full blur-[80px] pointer-events-none z-[-1]"></div>
    </>
  );
}
