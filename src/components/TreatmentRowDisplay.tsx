"use client";

import { useEffect, useState } from "react";
import type { TreatmentRow } from "@/lib/ai/treatments";
import { DRUG_IMAGE_PLACEHOLDER, resolveDrugImageUrl } from "@/lib/drug-image";

/** Shared layout: drug image, names, dosage, supportive care, regional / Rx badges */
export function TreatmentRowDisplay({ t }: { t: TreatmentRow }) {
  const rx = t.prescription_required === true;
  const isolation = t.isolation_required === true;
  const localOk = t.available_in_your_region !== false;
  const initialSrc = resolveDrugImageUrl(t.image_url);
  const [imgSrc, setImgSrc] = useState(initialSrc);

  useEffect(() => {
    setImgSrc(initialSrc);
  }, [initialSrc]);

  return (
    <div className="flex gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--color-primary-container)]/10 text-[var(--color-primary)]">
        <img
          src={imgSrc}
          alt={t.drug_name}
          className="h-full w-full object-contain p-1"
          loading="lazy"
          onError={() => setImgSrc(DRUG_IMAGE_PLACEHOLDER)}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="font-headline text-xl font-bold text-[var(--color-on-surface)]">{t.drug_name}</p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {!localOk ? (
              <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
                Check local availability
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-[var(--color-secondary-container)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-on-secondary-container)]">
                In your region
              </span>
            )}
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                rx
                  ? "bg-[var(--color-tertiary-fixed)] text-[var(--color-on-tertiary-fixed)]"
                  : "bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed)]"
              }`}
            >
              {rx ? "Prescription" : "OTC"}
            </span>
          </div>
        </div>
        {t.generic_name ? (
          <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">
            Active ingredient: <span className="font-medium">{t.generic_name}</span>
          </p>
        ) : null}
        {t.dosage_text ? (
          <div className="mt-4 rounded-lg bg-[var(--color-surface-container-low)] p-4 space-y-2">
            <div>
              <span className="font-label text-xs font-bold uppercase text-[var(--color-outline)]">Dosage &amp; use</span>
              <p className="mt-1 text-sm font-medium text-[var(--color-on-surface)]">{t.dosage_text}</p>
            </div>
            {t.course_duration_text ? (
              <div className="pt-2 border-t border-[var(--color-outline-variant)]/20">
                <span className="font-label text-xs font-bold uppercase text-[var(--color-outline)]">
                  Typical course length
                </span>
                <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">{t.course_duration_text}</p>
                <p className="mt-1 text-xs text-[var(--color-outline)]">Confirm with a vet for drugs and your situation.</p>
              </div>
            ) : null}
          </div>
        ) : t.course_duration_text ? (
          <div className="mt-4 rounded-lg bg-[var(--color-surface-container-low)] p-4">
            <span className="font-label text-xs font-bold uppercase text-[var(--color-outline)]">Typical course length</span>
            <p className="mt-1 text-sm text-[var(--color-on-surface)]">{t.course_duration_text}</p>
            <p className="mt-1 text-xs text-[var(--color-outline)]">Confirm with a vet for your animal.</p>
          </div>
        ) : null}
        {t.supportive_care ? (
          <div className="mt-3 rounded-lg border border-[var(--color-outline-variant)]/20 p-4">
            <span className="font-label text-xs font-bold uppercase text-[var(--color-outline)]">
              Supportive care / notes
            </span>
            <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">{t.supportive_care}</p>
          </div>
        ) : null}
        {isolation ? (
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-error)]">
            <span className="material-symbols-outlined text-lg">shield_person</span>
            Isolation may be required — follow veterinary guidance.
          </p>
        ) : null}
        {t.source_reference ? (
          <p className="mt-2 text-xs text-[var(--color-outline)]">Reference: {t.source_reference}</p>
        ) : null}
      </div>
    </div>
  );
}
