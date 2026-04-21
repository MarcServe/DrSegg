import type { TreatmentRow } from "@/lib/ai/treatments";

/** Shared layout: drug image, names, dosage, supportive care, regional / Rx badges */
export function TreatmentRowDisplay({ t }: { t: TreatmentRow }) {
  const rx = t.prescription_required === true;
  const isolation = t.isolation_required === true;
  const localOk = t.available_in_your_region !== false;
  const img = t.image_url?.trim();

  return (
    <div className="flex gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--color-primary-container)]/10 text-[var(--color-primary)]">
        {img ? (
          <img
            src={img}
            alt={t.drug_name}
            className="h-full w-full object-contain p-1"
            loading="lazy"
          />
        ) : (
          <span className="material-symbols-outlined text-3xl">medication</span>
        )}
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
          <div className="mt-4 rounded-lg bg-[var(--color-surface-container-low)] p-4">
            <span className="font-label text-xs font-bold uppercase text-[var(--color-outline)]">Dosage</span>
            <p className="mt-1 text-sm font-medium text-[var(--color-on-surface)]">{t.dosage_text}</p>
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
