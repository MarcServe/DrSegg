"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCase } from "@/context/CaseContext";
import BottomNavBar from "@/components/BottomNavBar";
import { AppLogo } from "@/components/AppLogo";

type Treatment = {
  id: string;
  active_ingredient: string;
  brands: string[];
  region: string;
  availability: string;
  dosage: string;
  withdrawal_period: string;
  warnings: string[];
};

function mapApiTreatment(
  t: {
    drug_name: string;
    generic_name?: string | null;
    dosage_text?: string | null;
    prescription_required?: boolean | null;
    supportive_care?: string | null;
  },
  region: string
): Treatment {
  return {
    id: t.drug_name,
    active_ingredient: t.generic_name || "",
    brands: [t.drug_name],
    region,
    availability: t.prescription_required ? "Vet Required" : "OTC",
    dosage: t.dosage_text || "Per product label or veterinarian",
    withdrawal_period: "Per label / regulatory rules",
    warnings: t.supportive_care ? [t.supportive_care] : [],
  };
}

export default function TreatmentOptions() {
  const { caseState } = useCase();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [apiWarnings, setApiWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const response = await fetch("/api/treatment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            region: caseState.region,
            condition: caseState.possibleConditions[0] || "",
            species: caseState.animalType || "poultry",
            caseId: caseState.caseId,
          }),
        });
        const data = await response.json();
        const raw = (data.treatments || []) as {
          drug_name: string;
          generic_name?: string | null;
          dosage_text?: string | null;
          prescription_required?: boolean | null;
          supportive_care?: string | null;
        }[];
        setTreatments(raw.map((t) => mapApiTreatment(t, caseState.region)));
        setApiWarnings(data.warnings || []);
      } catch (error) {
        console.error("Failed to fetch treatments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTreatments();
  }, [caseState]);

  return (
    <>
      {/* TopAppBar */}
      <header className="flex justify-between items-center px-6 py-4 w-full bg-[#f9faf6] dark:bg-stone-950 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/analysis-result" className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 cursor-pointer active:scale-95 duration-150">
            arrow_back
          </Link>
          <AppLogo href="/" size={104} />
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 cursor-pointer active:scale-95 duration-150 hover:bg-[#e2e3df] dark:hover:bg-stone-800 rounded-full p-2"
            aria-label="Settings"
          >
            settings
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-8 pb-32">
        {/* Region Selector & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex-1">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 bg-[var(--color-primary-container)]/10 px-4 py-1.5 rounded-full text-[var(--color-primary)] mb-4 cursor-pointer hover:opacity-90 active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-sm filled-icon">location_on</span>
              <span className="font-label text-sm font-bold uppercase tracking-wider">
                {caseState.region}
              </span>
            </Link>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
              Available treatment options in your region
            </h1>
          </div>
          <button type="button" className="flex items-center gap-2 bg-[var(--color-surface-container-highest)] px-6 py-4 rounded-xl hover:bg-[#e2e3df] transition-colors active:scale-95 duration-150 cursor-pointer">
            <span className="material-symbols-outlined text-[var(--color-primary)]">distance</span>
            <span className="font-label font-bold text-[var(--color-on-surface-variant)]">Change Region</span>
          </button>
        </div>

        {/* Treatment Bento Grid */}
        {apiWarnings.length > 0 && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-[var(--color-on-surface)]">
            {apiWarnings.join(" ")}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
            {/* Treatment Card 1 (Large Feature) */}
            {treatments.length > 0 && (
              <Link
                href="/follow-up"
                className="lg:col-span-7 bg-[var(--color-surface-container-lowest)] rounded-xl p-8 shadow-[0px_12px_32px_rgba(44,105,78,0.05)] border border-[var(--color-outline-variant)]/15 flex flex-col gap-6 cursor-pointer hover:bg-[var(--color-surface-container-low)] active:scale-[0.99] transition-all"
              >
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-1/3 aspect-square rounded-lg overflow-hidden bg-[var(--color-surface-container)] relative">
                    <Image
                      className="object-cover"
                      alt={treatments[0].brands[0]}
                      fill
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuANEhhJ6Vw9UB4eHW88mzNhlAY6V0eeHuFvZo6wIIWxEUP8wn-4dJ5kOeVlvKiJYGC6chNyxzf5FV5HHNsuvPlIoHGI2tUH9-vBPO77yPaPMEGQhqqL8Xm8gmdf9thuFktT1bBW8zVIGmhf0g-eQE3kTm7AYaxV4iCgiGYrnVHbslPhHEN7pZ0ZM7CRCp93lHVkD5rGNC8VsZO1BUloZryOWdsCZyXnaYM3fuYIj08ckVsTgOxsgW95_IjXnWdQtgTSQCpTAGkN42Q"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="font-headline text-2xl font-bold text-[var(--color-primary)]">{treatments[0].brands[0]}</h2>
                        <div className="flex items-center gap-1 bg-[var(--color-tertiary-fixed)] text-[var(--color-on-tertiary-fixed)] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                          <span className="material-symbols-outlined text-sm">prescriptions</span>
                          {treatments[0].availability}
                        </div>
                      </div>
                      <p className="font-body text-[var(--color-on-surface-variant)] mb-4 leading-relaxed">
                        High-potency {treatments[0].active_ingredient.toLowerCase()} for severe infections.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[var(--color-primary-container)]">science</span>
                          <span className="text-sm font-semibold">Broad Spectrum</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[var(--color-primary-container)]">timer</span>
                          <span className="text-sm font-semibold">48h Release</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[var(--color-outline-variant)]/10">
                  <div className="bg-[var(--color-surface-container-low)] p-4 rounded-lg">
                    <span className="font-label text-xs font-bold uppercase text-[var(--color-outline)] block mb-3">
                      Recommended Dosage
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center text-white font-headline text-xl font-bold">
                        {treatments[0].dosage.replace(/\D/g, "").slice(0, 2) || "—"}
                      </div>
                      <div>
                        <div className="font-bold text-[var(--color-on-surface)]">{treatments[0].dosage}</div>
                        <div className="text-xs text-[var(--color-on-surface-variant)]">Subcutaneous injection</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[var(--color-error-container)]/30 p-4 rounded-lg">
                    <span className="font-label text-xs font-bold uppercase text-[var(--color-error)] block mb-3">
                      Withdrawal Period
                    </span>
                    <div className="flex items-center gap-3 text-[var(--color-on-error-container)]">
                      <span className="material-symbols-outlined filled-icon">warning</span>
                      <span className="font-bold">{treatments[0].withdrawal_period}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Treatment Card 2 (Secondary) */}
            {treatments.length > 1 && (
              <Link
                href="/follow-up"
                className="lg:col-span-5 bg-[var(--color-surface-container)] rounded-xl p-8 flex flex-col justify-between cursor-pointer hover:opacity-95 active:scale-[0.99]"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-white shadow-sm relative">
                      <Image
                        className="object-cover"
                        alt={treatments[1].brands[0]}
                        fill
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLr_gQpRjNov8-RtGwWpxlojx5GHBznWjoSdiP6uWkywODQ8Ud4FkpM20lRtraeCqGVQOiDMtiyCe2sRhK3bLYpevrtpSP357nbEvwrf2QlwCt3B3FKtXrFApFNeW3rRV7-ZeRd2kyNTCoiLdL0PvR-XAr7WK1DTxq0kHZW4JkH16F4QSmujkgbGrXF-Zv3IhhX-H_iEi9yd_O0LRsh7tBbJSzfCv0MlPnnlDyX8Gh-zdga0_FADhJrgy-QIJQUQEximUdJwJe0sk"
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed)] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                      <span className="material-symbols-outlined text-sm">shopping_cart</span>
                      {treatments[1].availability}
                    </div>
                  </div>
                  <h2 className="font-headline text-xl font-bold text-[var(--color-on-surface)] mb-2">{treatments[1].brands[0]}</h2>
                  <p className="font-body text-sm text-[var(--color-on-surface-variant)] leading-relaxed mb-6">
                    Dietary supplement for rumen health and natural parasite resistance during seasonal transitions.
                  </p>
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-4 bg-[var(--color-surface-container-lowest)] p-3 rounded-lg">
                      <span className="material-symbols-outlined text-[var(--color-primary)]">pill</span>
                      <div className="text-sm font-bold">{treatments[1].dosage}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-[var(--color-surface-container-highest)] p-4 rounded-lg border border-white/50">
                  <span className="font-label text-xs font-bold uppercase text-[var(--color-outline)] block mb-2">
                    Warnings
                  </span>
                  <p className="text-xs font-medium text-[var(--color-on-surface-variant)] italic">
                    {treatments[1].warnings[0]}
                  </p>
                </div>
              </Link>
            )}

            {/* Treatment Card 3 (Status Alert Style) */}
            <Link
              href="/follow-up"
              className="lg:col-span-4 bg-[var(--color-surface-container-lowest)] rounded-xl p-6 shadow-sm border border-[var(--color-outline-variant)]/10 block cursor-pointer hover:bg-[var(--color-surface-container-low)] active:scale-[0.99]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline font-bold text-[var(--color-primary)]">FlyShield Spray</h3>
                <span className="material-symbols-outlined text-[var(--color-primary-container)]">bug_report</span>
              </div>
              <div className="aspect-video w-full rounded-lg overflow-hidden mb-4 relative">
                <Image
                  className="object-cover"
                  alt="FlyShield Spray"
                  fill
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYkxWqp6d100eeVK8cDELEafitTpjNENPFWp_HG9EC_Nqr8PZ--U_G8b_c4SYnTzeficf36waoNhWNJ3yiYv-pW3hcccLuF9tWf_DBU7bzMNO0XH_7qUw3kdh0zD-cerjUONMd549jcnT-K4nXv-WN3Lmp8So2lkomMnkPP_sy5i2XaeNWN_BoMhd-GBM5Z9_cwG99tS7c2ulE25jsielDHfl-scoOcoWxdqEgxlB_Q2YNzDSOmdxFL07VBR9jcV7kVPryU7C10DI"
                />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[var(--color-primary)] filled-icon">check_circle</span>
                <span className="text-sm font-bold">OTC Availability</span>
              </div>
              <div className="bg-[var(--color-primary-container)]/10 p-3 rounded-lg text-center font-bold text-[var(--color-primary)] mb-2">
                50ml per animal
              </div>
              <div className="text-[10px] uppercase font-bold text-[var(--color-outline)] text-center">
                Topical Application Only
              </div>
            </Link>

            {/* Treatment Card 4 (Small High Contrast) */}
            <Link
              href="/follow-up"
              className="lg:col-span-8 bg-[var(--color-surface-container-high)] rounded-xl p-8 flex flex-col md:flex-row gap-8 items-center cursor-pointer hover:opacity-95 active:scale-[0.99]"
            >
              <div className="flex-1">
                <div className="inline-block bg-[var(--color-tertiary-container)] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase mb-3">
                  Critical Support
                </div>
                <h2 className="font-headline text-2xl font-bold text-[var(--color-on-surface)] mb-2">
                  HydraFlow IV Solutions
                </h2>
                <p className="font-body text-[var(--color-on-surface-variant)] mb-6">
                  Rapid electrolyte restoration for acute dehydration in calves.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--color-tertiary)]">water_drop</span>
                    <span className="font-bold">500ml Volume</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--color-tertiary)]">medical_information</span>
                    <span className="font-bold">Vet Supervision</span>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-48 bg-[var(--color-surface-container-lowest)] rounded-xl p-4 shadow-inner">
                <span className="font-label text-xs font-bold text-[var(--color-outline)] block text-center mb-4 uppercase">
                  Dosage Visual
                </span>
                <div className="flex flex-col gap-2">
                  <div className="h-2 w-full bg-[var(--color-surface-container)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-primary)] w-full"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-[var(--color-on-surface-variant)]">
                    <span>0ml</span>
                    <span>500ml</span>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <span className="text-2xl font-black text-[var(--color-on-surface)]">FULL</span>
                  <p className="text-[10px] text-[var(--color-outline)] uppercase font-bold">Per incident</p>
                </div>
              </div>
            </Link>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/follow-up" className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--color-primary)] text-white rounded-full shadow-2xl font-headline font-bold tracking-tight hover:opacity-90 active:scale-90 duration-150">
            <span>Start Treatment & Track Progress</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </main>

      <BottomNavBar />
    </>
  );
}
