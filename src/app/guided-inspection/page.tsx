"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCase } from "@/context/CaseContext";
import { createClient } from "@/lib/supabase/client";
import BottomNavBar from "@/components/BottomNavBar";
import { AppLogo } from "@/components/AppLogo";
import {
  getMonitoringContent,
  parseMonitoringTrack,
  type MonitoringContext,
  type MonitoringTrack,
} from "@/lib/monitoring-tips";
import { getCaseIdFromUrl, resolveEffectiveCaseId } from "@/lib/case-url";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function GuidedInspectionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { caseState, setCaseId } = useCase();
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const caseIdFromUrl = getCaseIdFromUrl(searchParams);
  const effectiveCaseId = resolveEffectiveCaseId(caseIdFromUrl, caseState.caseId);

  const track: MonitoringTrack = useMemo(
    () => parseMonitoringTrack(searchParams.get("track")),
    [searchParams]
  );

  const monitoringCtx: MonitoringContext = useMemo(
    () => ({
      species: caseState.animalType || "",
      symptoms: caseState.symptoms,
      suggestedNextChecks: caseState.suggestedNextChecks,
      possibleConditions: caseState.possibleConditions,
      redFlags: caseState.redFlags,
    }),
    [
      caseState.animalType,
      caseState.symptoms,
      caseState.suggestedNextChecks,
      caseState.possibleConditions,
      caseState.redFlags,
    ]
  );

  const copy = useMemo(() => getMonitoringContent(track, monitoringCtx), [track, monitoringCtx]);
  const isVisual = track === "visual";

  useEffect(() => {
    if (caseIdFromUrl && caseIdFromUrl !== caseState.caseId) {
      setCaseId(caseIdFromUrl);
    }
  }, [caseIdFromUrl, caseState.caseId, setCaseId]);

  const currentQueryPath = useCallback(() => {
    const p = new URLSearchParams();
    if (effectiveCaseId) p.set("case", effectiveCaseId);
    if (track !== "visual") p.set("track", track);
    const s = p.toString();
    return s ? `/guided-inspection?${s}` : "/guided-inspection";
  }, [effectiveCaseId, track]);

  const uploadFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || !effectiveCaseId) return;
      setUploadBusy(true);
      setUploadMessage(null);
      const label = copy.uploadLabel;
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push(`/login?next=${encodeURIComponent(currentQueryPath())}`);
          return;
        }

        let ok = 0;
        for (const file of Array.from(files)) {
          const isVideo = file.type.startsWith("video/");
          const path = `${user.id}/staging/${crypto.randomUUID()}-${safeFileName(file.name)}`;
          const { error: upErr } = await supabase.storage.from("case-media").upload(path, file, {
            upsert: false,
            contentType: file.type || (isVideo ? "video/mp4" : "image/jpeg"),
          });
          if (upErr) {
            setUploadMessage(upErr.message || "Upload failed");
            continue;
          }
          const { error: insErr } = await supabase.from("case_inputs").insert({
            case_id: effectiveCaseId,
            type: isVideo ? "video" : "image",
            file_url: path,
            transcription: `${label} (${isVideo ? "video" : "photo"})`,
          });
          if (insErr) {
            setUploadMessage(insErr.message || "Could not attach to case");
            continue;
          }
          ok += 1;
        }
        if (ok > 0) {
          setUploadMessage(
            `Saved ${ok} file${ok === 1 ? "" : "s"} to your case. You can run analysis from New case or Follow-up.`
          );
        }
      } finally {
        setUploadBusy(false);
      }
    },
    [copy.uploadLabel, currentQueryPath, effectiveCaseId, router]
  );

  const caseHref = effectiveCaseId ? `/case/${effectiveCaseId}` : null;
  const badgeLabel = isVisual ? "Inspection point" : "Monitoring focus";

  return (
    <>
      <header className="flex justify-between items-center px-6 py-4 w-full bg-[var(--color-surface-container-low)] dark:bg-stone-900 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link
            href="/health-status"
            className="p-2 rounded-full hover:bg-[#e2e3df] transition-colors active:scale-95 duration-150"
          >
            <span className="material-symbols-outlined text-[#0f5238]">close</span>
          </Link>
          <AppLogo href="/cases" size={104} />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="material-symbols-outlined text-[#414941] p-2 rounded-full hover:bg-[#e2e3df] cursor-pointer active:scale-95"
            aria-label="Settings"
          >
            settings
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-32 pt-6">
        <div className="mb-10 px-2">
          <div className="flex justify-between items-end mb-3 gap-2">
            <div>
              <p className="text-[var(--color-on-surface-variant)] font-label text-sm font-bold uppercase tracking-widest">
                {copy.section}
              </p>
              {isVisual && (
                <p className="font-headline font-extrabold text-2xl text-[var(--color-primary)] mt-1">
                  Visual inspection
                </p>
              )}
            </div>
            <div className="text-right text-sm">
              {effectiveCaseId ? (
                <p className="text-[var(--color-on-surface-variant)] font-body font-medium max-w-[11rem]">
                  Media saves to{" "}
                  {caseHref ? (
                    <Link href={caseHref} className="font-bold text-[var(--color-primary)] underline underline-offset-2">
                      current case
                    </Link>
                  ) : (
                    <span className="font-bold text-[var(--color-on-surface)]">current case</span>
                  )}
                </p>
              ) : (
                <p className="text-[var(--color-on-surface-variant)] font-body font-medium max-w-[10rem]">
                  Open from a <span className="font-bold text-[var(--color-on-surface)]">case</span> to attach here, or use{" "}
                  <span className="font-bold">New case</span>
                </p>
              )}
            </div>
          </div>
          <div className="h-3 w-full bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
              style={{ width: `${copy.progressPct}%` }}
            />
          </div>
        </div>

        <section className="space-y-8">
          <div className="w-full bg-[var(--color-surface-container-lowest)] rounded-xl p-8 shadow-[0px_12px_32px_rgba(44,105,78,0.08)] relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary-fixed)]/20 rounded-bl-[5rem] -mr-8 -mt-8" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-[var(--color-primary-fixed)] px-4 py-1.5 rounded-full mb-6">
                <span className="material-symbols-outlined text-[var(--color-on-primary-fixed)] filled-icon">
                  {copy.heroIcon}
                </span>
                <span className="text-[var(--color-on-primary-fixed)] font-headline font-bold text-sm uppercase tracking-wide">
                  {badgeLabel}
                </span>
              </div>
              <h2 className="font-manrope text-3xl font-extrabold text-[var(--color-on-surface)] mb-4">
                {copy.title}
              </h2>
              <p className="text-lg text-[var(--color-on-surface-variant)] leading-relaxed max-w-prose">
                {copy.lead}
                {effectiveCaseId && (
                  <>
                    {" "}
                    Use <strong className="text-[var(--color-on-surface)]">Take photo</strong> or{" "}
                    <strong className="text-[var(--color-on-surface)]">Record video</strong> below — files attach to this
                    case for Dr Morgees review.
                  </>
                )}
                {!effectiveCaseId && (
                  <>
                    {" "}
                    <Link href="/new-case" className="text-[var(--color-primary)] font-bold underline underline-offset-2">
                      Start a case
                    </Link>{" "}
                    to save media here, or go to <Link href="/cases" className="font-bold underline">Cases</Link>.
                  </>
                )}
              </p>
              {!isVisual && copy.tips.length > 0 && (
                <ul className="mt-4 list-disc pl-5 space-y-2 text-[var(--color-on-surface)] text-base max-w-prose">
                  {copy.tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-8 flex h-56 sm:h-64 items-center justify-center rounded-lg border-4 border-[var(--color-surface-container-high)] bg-[var(--color-surface-container-low)]">
              <div className="flex flex-col items-center gap-3 px-6 text-center text-[var(--color-primary)]">
                <span className="material-symbols-outlined text-6xl">{copy.heroIcon}</span>
                <span className="font-label text-sm font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)]">
                  {effectiveCaseId
                    ? "Upload attaches to your case — steady lighting, avoid glare"
                    : "Link a case from Health status or New case to save uploads here"}
                </span>
              </div>
            </div>
            {uploadMessage && (
              <p
                className={`mt-4 text-sm px-2 ${uploadMessage.includes("fail") || uploadMessage.includes("Could not") ? "text-[var(--color-error)]" : "text-[var(--color-on-surface-variant)]"}`}
              >
                {uploadMessage}
              </p>
            )}
            <div className="mt-6 p-5 bg-[var(--color-surface-container-low)] rounded-lg flex items-start gap-4">
              <span className="material-symbols-outlined text-[var(--color-primary-container)]">info</span>
              <div>
                <p className="font-bold text-[var(--color-on-surface-variant)] text-sm uppercase">Tip</p>
                <p className="text-[var(--color-on-surface-variant)] text-sm mt-1">{copy.tipBox}</p>
              </div>
            </div>
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              void uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              void uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {effectiveCaseId ? (
              <>
                <button
                  type="button"
                  disabled={uploadBusy}
                  onClick={() => photoInputRef.current?.click()}
                  className="flex items-center justify-center gap-3 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white py-6 px-8 rounded-full shadow-[0px_12px_32px_rgba(44,105,78,0.2)] active:scale-95 transition-all group cursor-pointer text-center disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-3xl group-active:scale-110 transition-transform">
                    photo_camera
                  </span>
                  <span className="font-headline font-bold text-lg">{uploadBusy ? "Uploading…" : "Take photo"}</span>
                </button>
                <button
                  type="button"
                  disabled={uploadBusy}
                  onClick={() => videoInputRef.current?.click()}
                  className="flex items-center justify-center gap-3 bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)] py-6 px-8 rounded-full active:scale-95 transition-all group cursor-pointer text-center border-2 border-transparent hover:border-[var(--color-primary)]/30 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-3xl">videocam</span>
                  <span className="font-headline font-bold text-lg">Record video</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/new-case?camera=photo"
                  className="flex items-center justify-center gap-3 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white py-6 px-8 rounded-full shadow-[0px_12px_32px_rgba(44,105,78,0.2)] active:scale-95 transition-all group cursor-pointer text-center"
                >
                  <span className="material-symbols-outlined text-3xl group-active:scale-110 transition-transform">
                    photo_camera
                  </span>
                  <span className="font-headline font-bold text-lg">Take photo</span>
                </Link>
                <Link
                  href="/new-case?camera=video"
                  className="flex items-center justify-center gap-3 bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)] py-6 px-8 rounded-full active:scale-95 transition-all group cursor-pointer text-center border-2 border-transparent hover:border-[var(--color-primary)]/30"
                >
                  <span className="material-symbols-outlined text-3xl">videocam</span>
                  <span className="font-headline font-bold text-lg">Record video</span>
                </Link>
              </>
            )}
          </div>

          {!effectiveCaseId && (
            <p className="text-center text-sm text-[var(--color-on-surface-variant)] px-2">
              <Link href="/cases" className="font-bold text-[var(--color-primary)] underline">
                Open a case
              </Link>{" "}
              and use the monitoring checklist on Health status, or add <span className="font-mono text-xs">?case=…</span> to this
              page&apos;s URL to attach media to that case.
            </p>
          )}

          <div className="text-center pt-2">
            <Link
              href={effectiveCaseId ? `/new-case?case=${effectiveCaseId}#symptoms-input` : "/new-case#symptoms-input"}
              className="text-[var(--color-on-surface-variant)] font-bold text-sm uppercase tracking-widest hover:text-[var(--color-primary)] transition-colors inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">edit_note</span>
              Add text symptoms instead
            </Link>
          </div>

          <div className="rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-low)] p-4 text-sm text-[var(--color-on-surface-variant)]">
            <p>
              After photos or video, select species and tap <strong>Analyze case</strong> on New case. Results appear on{" "}
              <Link href="/health-status" className="text-[var(--color-primary)] font-semibold underline">
                Health status
              </Link>{" "}
              and under{" "}
              <Link href="/cases" className="text-[var(--color-primary)] font-semibold underline">
                Cases
              </Link>
              {effectiveCaseId && (
                <>
                  . Media on this checklist is stored under{" "}
                  <Link href={caseHref!} className="text-[var(--color-primary)] font-semibold underline">
                    this case file
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
        </section>
      </main>

      <BottomNavBar />
    </>
  );
}

export default function GuidedInspection() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-28 text-center text-[var(--color-on-surface-variant)]">Loading…</div>
      }
    >
      <GuidedInspectionInner />
    </Suspense>
  );
}
