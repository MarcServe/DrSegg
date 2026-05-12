"use client";

import { useEffect, useState } from "react";
import type { TreatmentRow } from "@/lib/ai/treatments";
import {
  describeTreatmentProtocolDetail,
  protocolDetailNeedsRawFallback,
} from "@/lib/ai/clinical-intelligence";
import { DRUG_IMAGE_PLACEHOLDER, resolveDrugImageUrl } from "@/lib/drug-image";

const PROTO_JSON_CAP = 4000;

function protocolDetailJsonSnippet(detail: unknown): string {
  try {
    const s = JSON.stringify(detail, null, 2);
    if (s.length <= PROTO_JSON_CAP) return s;
    return `${s.slice(0, PROTO_JSON_CAP)}…`;
  } catch {
    return String(detail);
  }
}

/** Shared layout: drug image, names, dosage, supportive care, regional / Rx badges */
export function TreatmentRowDisplay({ t }: { t: TreatmentRow }) {
  const rx = t.prescription_required === true;
  const isolation = t.isolation_required === true;
  const localOk = t.available_in_your_region !== false;
  const protocolLines =
    t.protocol_detail !== undefined && t.protocol_detail !== null
      ? describeTreatmentProtocolDetail(t.protocol_detail)
      : [];
  const protocolRawFallback =
    t.protocol_detail !== undefined &&
    t.protocol_detail !== null &&
    protocolDetailNeedsRawFallback(t.protocol_detail);
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
        {protocolLines.length > 0 ? (
          <div className="mt-3 rounded-lg border border-[var(--color-primary)]/25 bg-[var(--color-primary-container)]/15 p-4">
            <span className="font-label text-xs font-bold uppercase text-[var(--color-primary)]">
              Protocol detail (database)
            </span>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--color-on-surface-variant)]">
              {protocolLines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-[var(--color-outline)]">
              Confirm dosing, withdrawals, and flock rules with a veterinarian.
            </p>
          </div>
        ) : null}
        {protocolRawFallback ? (
          <details className="mt-3 rounded-lg border border-[var(--color-outline-variant)]/30 p-3">
            <summary className="cursor-pointer font-label text-xs font-bold uppercase text-[var(--color-outline)]">
              Structured protocol data (JSON)
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-[var(--color-surface-container-low)] p-3 font-mono text-[11px] text-[var(--color-on-surface-variant)]">
              {protocolDetailJsonSnippet(t.protocol_detail)}
            </pre>
          </details>
        ) : null}
        {protocolLines.length > 0 && t.protocol_detail !== undefined && t.protocol_detail !== null ? (
          <details className="mt-2 rounded-lg border border-[var(--color-outline-variant)]/20 p-2">
            <summary className="cursor-pointer text-xs font-medium text-[var(--color-outline)]">
              View raw protocol JSON
            </summary>
            <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap break-words rounded-md bg-[var(--color-surface-container-low)] p-2 font-mono text-[10px] text-[var(--color-on-surface-variant)]">
              {protocolDetailJsonSnippet(t.protocol_detail)}
            </pre>
          </details>
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
