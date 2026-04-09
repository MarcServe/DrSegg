"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCase } from "@/context/CaseContext";
import { AnimalIcon } from "@/components/AnimalIcon";
import { createClient } from "@/lib/supabase/client";

function parseSymptoms(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function NewCaseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    caseState,
    setAnimalType,
    setHealthStatus,
    setAnalysisResult,
    setCaseId,
    setSymptoms,
    setAssessmentDetails,
  } = useCase();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [symptomText, setSymptomText] = useState("");
  const [mediaFiles, setMediaFiles] = useState<{ file: File; kind: "image" | "video" }[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const animal = searchParams.get("animal");
    if (animal === "poultry" || animal === "goat" || animal === "pig" || animal === "dog") {
      setAnimalType(animal);
    }
  }, [searchParams, setAnimalType]);

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
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?next=/new-case");
        return;
      }

      const symptoms = parseSymptoms(symptomText);
      const storagePaths: string[] = [];

      for (const { file, kind } of mediaFiles) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/staging/${crypto.randomUUID()}-${safeName}`;
        const { error } = await supabase.storage.from("case-media").upload(path, file, {
          upsert: false,
          contentType: file.type || (kind === "video" ? "video/mp4" : "image/jpeg"),
        });
        if (!error) {
          storagePaths.push(path);
        }
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          animal: caseState.animalType,
          symptoms,
          storage_paths: storagePaths,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error(data);
        alert(data.error || "Analysis failed");
        return;
      }

      setCaseId(data.case_id);
      setSymptoms(symptoms);
      setHealthStatus(data.health_status, data.confidence);
      if (data.possible_conditions) {
        setAnalysisResult(data.possible_conditions, data.severity);
      }
      setAssessmentDetails({
        summary: data.summary ?? null,
        needsMoreInfo: !!data.needs_more_info,
        missingInformation: data.missing_information ?? [],
        redFlags: data.red_flags ?? [],
        recommendationType: data.recommendation_type ?? null,
        suggestedNextChecks: data.suggested_next_checks ?? [],
        assessmentDisclaimer: data.disclaimer ?? null,
        differentialDiagnoses: data.differential_diagnoses ?? [],
        escalationSuggested:
          data.recommendation_type === "emergency" ||
          data.recommendation_type === "urgent_vet" ||
          (data.red_flags?.length ?? 0) > 0,
      });

      router.push("/health-status");
    } catch (error) {
      console.error("Failed to analyze case:", error);
      alert("Failed to analyze case");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onPickImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const next: { file: File; kind: "image" | "video" }[] = [];
    for (let i = 0; i < files.length; i++) {
      next.push({ file: files[i], kind: "image" });
    }
    setMediaFiles((prev) => [...prev, ...next]);
    e.target.value = "";
  };

  const onPickVideos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const next: { file: File; kind: "image" | "video" }[] = [];
    for (let i = 0; i < files.length; i++) {
      next.push({ file: files[i], kind: "video" });
    }
    setMediaFiles((prev) => [...prev, ...next]);
    e.target.value = "";
  };

  return (
    <>
      <header className="flex justify-between items-center px-6 py-4 w-full bg-[#f9faf6] dark:bg-stone-950 fixed top-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 text-[#0f5238] dark:text-emerald-500 hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors rounded-full active:scale-95 duration-150"
          >
            <span className="material-symbols-outlined">close</span>
          </Link>
          <h1 className="font-manrope text-xl font-bold tracking-tight text-[#0f5238] dark:text-emerald-500">
            New Case
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="p-2 text-[#0f5238] dark:text-emerald-500 hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors rounded-full active:scale-95 duration-150"
            aria-label="Help"
          >
            <span className="material-symbols-outlined">help</span>
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-12">
        <section className="space-y-6">
          <header className="space-y-1">
            <span className="font-label text-xs uppercase tracking-[0.2em] text-[var(--color-outline)] font-bold">
              Step 01
            </span>
            <h2 className="font-headline text-3xl font-extrabold text-[var(--color-on-surface)]">
              Select Patient
            </h2>
          </header>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setAnimalType("poultry")}
              className={getButtonClasses("poultry")}
            >
              <div className={getIconClasses("poultry")}>
                <AnimalIcon
                  animal="poultry"
                  size={36}
                  label="Poultry"
                  className={caseState.animalType === "poultry" ? "drop-shadow-md" : ""}
                />
              </div>
              <span
                className={`font-headline font-bold ${caseState.animalType === "poultry" ? "" : "text-[var(--color-on-surface-variant)]"}`}
              >
                Poultry
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAnimalType("goat")}
              className={getButtonClasses("goat")}
            >
              <div className={getIconClasses("goat")}>
                <AnimalIcon
                  animal="goat"
                  size={36}
                  label="Goat"
                  className={caseState.animalType === "goat" ? "drop-shadow-md" : ""}
                />
              </div>
              <span
                className={`font-headline font-bold ${caseState.animalType === "goat" ? "" : "text-[var(--color-on-surface-variant)]"}`}
              >
                Goat
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAnimalType("pig")}
              className={getButtonClasses("pig")}
            >
              <div className={getIconClasses("pig")}>
                <AnimalIcon
                  animal="pig"
                  size={36}
                  label="Pig"
                  className={caseState.animalType === "pig" ? "drop-shadow-md" : ""}
                />
              </div>
              <span
                className={`font-headline font-bold ${caseState.animalType === "pig" ? "" : "text-[var(--color-on-surface-variant)]"}`}
              >
                Pig
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAnimalType("dog")}
              className={getButtonClasses("dog")}
            >
              <div className={getIconClasses("dog")}>
                <AnimalIcon
                  animal="dog"
                  size={36}
                  label="Dog"
                  className={caseState.animalType === "dog" ? "drop-shadow-md" : ""}
                />
              </div>
              <span
                className={`font-headline font-bold ${caseState.animalType === "dog" ? "" : "text-[var(--color-on-surface-variant)]"}`}
              >
                Dog
              </span>
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <header className="space-y-1">
            <span className="font-label text-xs uppercase tracking-[0.2em] text-[var(--color-outline)] font-bold">
              Step 02
            </span>
            <h2 className="font-headline text-3xl font-extrabold text-[var(--color-on-surface)]">
              Gather Details
            </h2>
          </header>

          <label className="block">
            <span className="text-sm font-bold text-[var(--color-on-surface-variant)] mb-2 block">
              Symptoms (one per line or comma-separated)
            </span>
            <textarea
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              rows={4}
              placeholder="e.g. lethargy, reduced appetite"
              className="w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 py-3 text-[var(--color-on-surface)]"
            />
          </label>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onPickImages}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={onPickVideos}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center gap-6 p-8 bg-[var(--color-surface-container-lowest)] rounded-xl hover:bg-[var(--color-surface-container-low)] transition-colors text-left active:scale-[0.98] duration-150 border-2 border-transparent focus:border-[var(--color-primary)] cursor-pointer w-full"
            >
              <div className="w-16 h-16 flex-shrink-0 bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">videocam</span>
              </div>
              <div>
                <span className="block font-headline text-xl font-bold">Add Video</span>
                <span className="font-body text-sm text-[var(--color-outline)]">From your device</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-6 p-8 bg-[var(--color-surface-container-lowest)] rounded-xl hover:bg-[var(--color-surface-container-low)] transition-colors text-left active:scale-[0.98] duration-150 border-2 border-transparent focus:border-[var(--color-primary)] cursor-pointer w-full"
            >
              <div className="w-16 h-16 flex-shrink-0 bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">photo_camera</span>
              </div>
              <div>
                <span className="block font-headline text-xl font-bold">Upload Image</span>
                <span className="font-body text-sm text-[var(--color-outline)]">Photos for AI review</span>
              </div>
            </button>
            <button
              type="button"
              className="md:col-span-2 flex items-center justify-center gap-6 p-10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white rounded-xl active:scale-[0.98] duration-150 shadow-xl shadow-[var(--color-primary)]/20 group overflow-hidden relative cursor-pointer w-full opacity-90"
              disabled
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="relative z-10 w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl filled-icon">mic</span>
              </div>
              <div className="relative z-10 text-left">
                <span className="block font-headline text-2xl font-extrabold tracking-tight">
                  Speak Symptoms
                </span>
                <span className="font-body text-sm opacity-80">Coming soon — use text below for now</span>
              </div>
            </button>
          </div>

          {mediaFiles.length > 0 && (
            <ul className="text-sm text-[var(--color-on-surface-variant)] space-y-1">
              {mediaFiles.map((m, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span>
                    {m.kind === "video" ? "Video" : "Image"}: {m.file.name}
                  </span>
                  <button
                    type="button"
                    className="text-[var(--color-error)] font-bold"
                    onClick={() => setMediaFiles((prev) => prev.filter((_, j) => j !== i))}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link
          href="/guided-inspection"
          className="grid grid-cols-1 gap-4 mt-8 opacity-90 hover:opacity-100 transition-opacity"
        >
          <div className="flex items-center gap-4 p-4 bg-[var(--color-surface-container-low)] rounded-lg cursor-pointer active:scale-[0.99]">
            <span className="material-symbols-outlined text-[var(--color-primary)]">auto_awesome</span>
            <p className="font-body text-sm text-[var(--color-on-surface-variant)] font-medium">
              AI analysis uses your symptoms and any images you upload (OpenAI when configured).
            </p>
          </div>
        </Link>
      </main>

      <div className="fixed bottom-8 left-0 w-full flex justify-center z-50">
        <button
          type="button"
          onClick={() => void handleAnalyze()}
          disabled={!caseState.animalType || isAnalyzing}
          className={`flex items-center gap-3 px-8 py-4 bg-[var(--color-primary)] text-white rounded-full shadow-2xl font-headline font-bold tracking-tight hover:opacity-90 active:scale-90 duration-150 cursor-pointer ${!caseState.animalType || isAnalyzing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span>{isAnalyzing ? "Analyzing..." : "Analyze Case"}</span>
          <span className="material-symbols-outlined">
            {isAnalyzing ? "hourglass_empty" : "arrow_forward"}
          </span>
        </button>
      </div>

      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-[var(--color-primary)]/5 rounded-full blur-[100px] pointer-events-none z-[-1]"></div>
      <div className="fixed -top-24 -left-24 w-64 h-64 bg-[var(--color-tertiary)]/5 rounded-full blur-[80px] pointer-events-none z-[-1]"></div>
    </>
  );
}

export default function NewCasePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-28 text-center text-[var(--color-on-surface-variant)]">
          Loading…
        </div>
      }
    >
      <NewCaseForm />
    </Suspense>
  );
}
