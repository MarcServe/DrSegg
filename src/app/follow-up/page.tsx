"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCase } from "@/context/CaseContext";
import { createClient } from "@/lib/supabase/client";
import BottomNavBar from "@/components/BottomNavBar";
import { AppLogo } from "@/components/AppLogo";
import { AnimalIcon, animalTypeToIconKey } from "@/components/AnimalIcon";
import { getCaseIdFromUrl, resolveEffectiveCaseId } from "@/lib/case-url";

type CaseBundle = {
  region: string;
  case: {
    id: string;
    display_name: string | null;
    animal_type: string;
    health_status: string | null;
    created_at: string | null;
  };
  followups: { id: string; created_at: string; notes: string | null; status: string | null }[];
};

function FollowUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { caseState, setCaseId, setRegion } = useCase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reassessBusy, setReassessBusy] = useState(false);
  const [status, setStatus] = useState("improving");
  const [notes, setNotes] = useState("");
  const [bundle, setBundle] = useState<CaseBundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reassessMedia, setReassessMedia] = useState<{ file: File; kind: "image" | "video" }[]>([]);
  const reassessFileInputRef = useRef<HTMLInputElement>(null);

  const caseIdFromUrl = getCaseIdFromUrl(searchParams);
  const effectiveCaseId = resolveEffectiveCaseId(caseIdFromUrl, caseState.caseId);

  useEffect(() => {
    if (caseIdFromUrl && caseIdFromUrl !== caseState.caseId) {
      setCaseId(caseIdFromUrl);
    }
  }, [caseIdFromUrl, setCaseId, caseState.caseId]);

  useEffect(() => {
    if (!effectiveCaseId) {
      setBundle(null);
      return;
    }
    let cancelled = false;
    setLoadError(null);
    (async () => {
      try {
        const res = await fetch(`/api/cases/${effectiveCaseId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load case");
        if (!cancelled) {
          setBundle(data as CaseBundle);
          if (data.region) setRegion(data.region);
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load case");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveCaseId, setRegion]);

  const refreshFollowups = async () => {
    if (!effectiveCaseId) return;
    const res = await fetch(`/api/cases/${effectiveCaseId}`);
    const data = await res.json();
    if (res.ok) setBundle(data as CaseBundle);
  };

  const handleFollowUp = async () => {
    if (!effectiveCaseId) {
      alert("Open this page from a case (Cases → case), or use a link with ?case=…");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: effectiveCaseId,
          status,
          notes: notes.trim() || "Follow-up check-in (no additional notes)",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setNotes("");
      await refreshFollowups();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to record follow-up");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPickReassessMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const next: { file: File; kind: "image" | "video" }[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const isVid = f.type.startsWith("video/");
      next.push({ file: f, kind: isVid ? "video" : "image" });
    }
    setReassessMedia((prev) => [...prev, ...next]);
    e.target.value = "";
  };

  const removeReassessMedia = (idx: number) => {
    setReassessMedia((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleReassess = async () => {
    if (!effectiveCaseId) return;
    const hasFollowups = (bundle?.followups.length ?? 0) > 0;
    const hasMedia = reassessMedia.length > 0;
    if (!hasFollowups && !hasMedia) {
      alert("Save a follow-up note and/or add at least one photo or video for reassessment.");
      return;
    }
    setReassessBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(`/follow-up?case=${effectiveCaseId}`)}`);
        return;
      }

      const storagePaths: string[] = [];
      for (const { file, kind } of reassessMedia) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/staging/${crypto.randomUUID()}-${safeName}`;
        const { error: upErr } = await supabase.storage.from("case-media").upload(path, file, {
          upsert: false,
          contentType: file.type || (kind === "video" ? "video/mp4" : "image/jpeg"),
        });
        if (!upErr) storagePaths.push(path);
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          case_id: effectiveCaseId,
          symptoms: [],
          storage_paths: storagePaths,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setReassessMedia([]);
      router.push(`/analysis-result?case=${effectiveCaseId}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not run Dr Morgees reassessment");
    } finally {
      setReassessBusy(false);
    }
  };

  const canReassess =
    !!effectiveCaseId && ((bundle?.followups.length ?? 0) > 0 || reassessMedia.length > 0);

  const caseHref = effectiveCaseId ? `/case/${effectiveCaseId}` : "/cases";
  const iconKey = caseState.animalType ? animalTypeToIconKey(caseState.animalType) : null;
  const title =
    bundle?.case.display_name?.trim() ||
    (bundle?.case.animal_type ? `${bundle.case.animal_type} case` : null) ||
    (effectiveCaseId ? `Case #${effectiveCaseId.slice(0, 8)}` : "Follow-up");

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
          <div className="min-w-0">
            <span className="text-xs font-bold tracking-widest uppercase text-[var(--color-outline)] mb-1 block text-[var(--color-primary)]">
              {effectiveCaseId ? "View case file →" : "No case linked"}
            </span>
            <h2 className="text-2xl font-extrabold font-manrope text-[var(--color-primary)] tracking-tight break-words">
              {title}
            </h2>
            {loadError && <p className="text-sm text-[var(--color-error)] mt-1">{loadError}</p>}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-3 h-3 bg-[var(--color-primary)] rounded-full" />
              <span className="text-sm font-semibold text-[var(--color-on-surface-variant)]">
                Notes are saved on this case and included when you run a Dr Morgees reassessment.
              </span>
            </div>
          </div>
        </Link>

        <section className="space-y-3">
          <h3 className="font-headline text-lg font-bold text-[var(--color-on-surface)]">Follow-up history</h3>
          {!effectiveCaseId ? (
            <p className="text-sm text-[var(--color-on-surface-variant)]">
              Open this page from the case screen or add <span className="font-mono">?case=…</span> to the URL.
            </p>
          ) : bundle && bundle.followups.length === 0 ? (
            <p className="text-sm text-[var(--color-on-surface-variant)] rounded-xl border border-dashed border-[var(--color-outline-variant)] p-4">
              No follow-ups yet. Add notes below — they are stored for your records and for the next Dr Morgees review.
            </p>
          ) : (
            <ul className="space-y-3">
              {(bundle?.followups ?? []).map((f) => (
                <li
                  key={f.id}
                  className="bg-[var(--color-surface-container-low)] rounded-xl p-4 border border-[var(--color-outline-variant)]/20"
                >
                  <div className="flex justify-between gap-2 text-xs font-bold uppercase text-[var(--color-outline)]">
                    <span>{new Date(f.created_at).toLocaleString()}</span>
                    <span>{f.status === "worsening" ? "Worsening" : f.status === "improving" ? "Improving" : "—"}</span>
                  </div>
                  <p className="text-sm text-[var(--color-on-surface)] mt-2 whitespace-pre-wrap">{f.notes || "—"}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
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

        <section className="space-y-2">
          <label htmlFor="followup-notes" className="font-headline font-bold text-[var(--color-on-surface)]">
            Notes for this check-in
          </label>
          <textarea
            id="followup-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="What changed since last time? Appetite, breathing, droppings, behavior, treatments given…"
            className="w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 py-3 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)]"
          />
        </section>

        <section className="space-y-3 rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-low)]/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-headline font-bold text-[var(--color-on-surface)]">Media for Dr Morgees reassessment</h3>
            <button
              type="button"
              onClick={() => reassessFileInputRef.current?.click()}
              disabled={!effectiveCaseId}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-lg">add_a_photo</span>
              Add photos / video
            </button>
            <input
              ref={reassessFileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={onPickReassessMedia}
            />
          </div>
          <p className="text-xs text-[var(--color-on-surface-variant)]">
            New images or clips are uploaded securely and sent with your follow-up history to the model. You can reassess with media only, or combine with saved follow-up notes.
          </p>
          {reassessMedia.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {reassessMedia.map((m, idx) => (
                <li
                  key={`${m.file.name}-${idx}`}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-container-highest)] px-3 py-1 text-xs font-medium text-[var(--color-on-surface)]"
                >
                  <span className="material-symbols-outlined text-sm">
                    {m.kind === "video" ? "videocam" : "image"}
                  </span>
                  <span className="max-w-[10rem] truncate">{m.file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeReassessMedia(idx)}
                    className="material-symbols-outlined text-sm text-[var(--color-outline)] hover:text-[var(--color-error)] p-0.5"
                    aria-label="Remove file"
                  >
                    close
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-center flex-wrap">
          <button
            type="button"
            onClick={() => void handleFollowUp()}
            disabled={isSubmitting || !effectiveCaseId}
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[var(--color-primary)] text-white rounded-full shadow-lg font-headline font-bold tracking-tight hover:opacity-90 active:scale-95 duration-150 disabled:opacity-50"
          >
            <span>{isSubmitting ? "Saving…" : "Save follow-up"}</span>
            <span className="material-symbols-outlined">save</span>
          </button>
          <button
            type="button"
            onClick={() => void handleReassess()}
            disabled={reassessBusy || !canReassess}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-bold disabled:opacity-40"
            title={
              !canReassess
                ? "Add follow-up notes and/or media above, then run reassessment"
                : "Run a new assessment using follow-up history and any new media"
            }
          >
            <span className="material-symbols-outlined text-xl">psychology</span>
            {reassessBusy ? "Analyzing…" : "Run Dr Morgees reassessment"}
          </button>
        </div>
        {!effectiveCaseId && (
          <p className="text-sm text-center text-[var(--color-outline)]">
            Open this screen from Cases, or complete a new analysis first.
          </p>
        )}
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
