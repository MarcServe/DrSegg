"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCase } from "@/context/CaseContext";
import BottomNavBar from "@/components/BottomNavBar";
import { AppLogo } from "@/components/AppLogo";

export default function FollowUp() {
  const { caseState } = useCase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("improving");

  const handleFollowUp = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: caseState.caseId,
          status: status,
          notes: "Daily check-in via app"
        })
      });
      alert("Follow-up recorded successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to record follow-up");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <>
      {/* TopAppBar */}
      <header className="bg-[#f9faf6] dark:bg-stone-950 flex justify-between items-center px-6 py-4 w-full sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/treatment-options" className="hover:bg-[#e2e3df] transition-colors p-2 rounded-full active:scale-95 duration-150">
            <span className="material-symbols-outlined text-[#0f5238]">arrow_back</span>
          </Link>
          <AppLogo href="/" size={104} />
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
        {/* Animal Header Profile */}
        <Link href="/case/1" className="flex items-center gap-6 p-2 cursor-pointer active:scale-[0.99]">
          <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm relative">
            <Image
              className="object-cover"
              alt="Jersey Cow Profile"
              fill
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmXAxDvE1bE0polwSvcik_c2Hs6RENYmNnO7Mkxk2aPHNX22jpUQCvYNd8Fapn4p4hny7PT4P50DYEZiDmm_qKx0z1M9VR0KaEkHQpsHsD_kNrQQyrar7j7wZcoprJekM36P1f3BeiXpKuWczdOjbJtNmUdxJjj5LH9x-U5-bXgmwpsA4EOyTCX0Mzm8CCQpbrgayB_BrmahtregM05XTuzRrp4itijGYECBgenz1lDMT1UgRYN1jNFANDpO0invz3AB4cu5B-lH8"
            />
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-[var(--color-outline)] mb-1 block">
              Case {caseState.caseId ? `#${caseState.caseId.substring(0, 6)}` : '#2084'}
            </span>
            <h2 className="text-3xl font-extrabold font-manrope text-[var(--color-primary)] tracking-tight">
              Daisy — {caseState.possibleConditions[0] || 'Left Forelimb'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-3 h-3 bg-[var(--color-primary)] rounded-full"></div>
              <span className="text-sm font-semibold text-[var(--color-on-surface-variant)]">Active Treatment</span>
            </div>
          </div>
        </Link>

        {/* Progress Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overall Status Card */}
          <button type="button" className="md:col-span-2 bg-[var(--color-surface-container-lowest)] p-8 rounded-xl flex flex-col justify-between min-h-[220px] text-left cursor-pointer hover:bg-[var(--color-surface-container-low)] active:scale-[0.99] transition-all w-full">
            <div>
              <h3 className="text-sm font-bold text-[var(--color-outline)] uppercase tracking-wider mb-4">
                Current Recovery Status
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold font-manrope text-[var(--color-primary)]">Improving</span>
                <span className="material-symbols-outlined text-[var(--color-primary)] text-4xl filled-icon">
                  trending_up
                </span>
              </div>
              <p className="text-lg text-[var(--color-on-surface-variant)] mt-4 max-w-sm">
                Daisy is showing better mobility compared to Day 1. Swelling has reduced by approximately 30%.
              </p>
            </div>
            {/* Progress Dots */}
            <div className="flex gap-3 mt-8">
              <div className="h-2 w-16 bg-[var(--color-primary)] rounded-full"></div>
              <div className="h-2 w-16 bg-[var(--color-primary)] rounded-full"></div>
              <div className="h-2 w-16 bg-[var(--color-primary)] rounded-full opacity-30"></div>
              <div className="h-2 w-16 bg-[var(--color-primary)] rounded-full opacity-10"></div>
            </div>
          </button>

          {/* Stats Card */}
          <button type="button" className="bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] p-8 rounded-xl flex flex-col justify-center items-center text-center cursor-pointer hover:opacity-95 active:scale-[0.99] w-full">
            <span className="material-symbols-outlined text-5xl mb-4">ecg_heart</span>
            <span className="text-4xl font-bold font-manrope">Day 3</span>
            <span className="text-sm font-medium opacity-80 mt-1 uppercase tracking-widest">Post-Treatment</span>
          </button>
        </section>

        {/* Timeline View */}
        <section className="space-y-6">
          <Link href="/case/1" className="text-xl font-bold font-manrope px-2 block cursor-pointer hover:text-[var(--color-primary)] w-fit">
            Recovery Timeline
          </Link>
          <div className="space-y-4">
            {/* Day 3 (Latest) */}
            <button type="button" className="w-full bg-[var(--color-surface-container-low)] p-6 rounded-xl flex items-center justify-between group hover:bg-[var(--color-surface-container-high)] transition-colors text-left cursor-pointer active:scale-[0.99]">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div>
                  <p className="font-bold text-lg">Today, Oct 24</p>
                  <p className="text-[var(--color-on-surface-variant)] text-sm">Swelling significantly reduced</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-4 py-1 bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed)] rounded-full text-xs font-bold flex items-center gap-1">
                  IMPROVING <span className="material-symbols-outlined text-sm">trending_up</span>
                </span>
                <span className="material-symbols-outlined text-[var(--color-outline)]">chevron_right</span>
              </div>
            </button>

            {/* Day 2 */}
            <button type="button" className="w-full bg-[var(--color-surface-container-low)] p-6 rounded-xl flex items-center justify-between opacity-80 text-left cursor-pointer hover:opacity-100 active:scale-[0.99]">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-[var(--color-surface-container-highest)] rounded-full flex items-center justify-center text-[var(--color-on-surface)] font-bold">
                  2
                </div>
                <div>
                  <p className="font-bold text-lg">Yesterday</p>
                  <p className="text-[var(--color-on-surface-variant)] text-sm">Appetite returned to normal levels</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-4 py-1 bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] rounded-full text-xs font-bold flex items-center gap-1">
                  UNCHANGED <span className="material-symbols-outlined text-sm">horizontal_rule</span>
                </span>
                <span className="material-symbols-outlined text-[var(--color-outline)]">chevron_right</span>
              </div>
            </button>

            {/* Day 1 */}
            <button type="button" className="w-full bg-[var(--color-surface-container-low)] p-6 rounded-xl flex items-center justify-between opacity-60 text-left cursor-pointer hover:opacity-80 active:scale-[0.99]">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-[var(--color-surface-container-highest)] rounded-full flex items-center justify-center text-[var(--color-on-surface)] font-bold">
                  1
                </div>
                <div>
                  <p className="font-bold text-lg">Oct 22</p>
                  <p className="text-[var(--color-on-surface-variant)] text-sm">Initial injury assessment and icing</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-4 py-1 bg-[var(--color-tertiary-fixed)] text-[var(--color-on-tertiary-fixed-variant)] rounded-full text-xs font-bold flex items-center gap-1">
                  WORSENING <span className="material-symbols-outlined text-sm">trending_down</span>
                </span>
                <span className="material-symbols-outlined text-[var(--color-outline)]">chevron_right</span>
              </div>
            </button>
          </div>
        </section>

        {/* Quick Actions Canvas */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <button type="button" onClick={() => setStatus("improving")} className={`bg-[var(--color-surface-container-highest)] p-8 rounded-xl flex flex-col items-center gap-4 hover:bg-[var(--color-surface-variant)] transition-colors active:scale-95 group cursor-pointer ${status === 'improving' ? 'ring-4 ring-[var(--color-primary)]' : ''}`}>
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl">trending_up</span>
            </div>
            <span className="text-lg font-bold font-manrope">Improving</span>
          </button>
          <button type="button" onClick={() => setStatus("worsening")} className={`bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] p-8 rounded-xl flex flex-col items-center gap-4 hover:opacity-90 transition-opacity active:scale-95 text-white group cursor-pointer ${status === 'worsening' ? 'ring-4 ring-red-500' : ''}`}>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-white text-3xl filled-icon">trending_down</span>
            </div>
            <span className="text-lg font-bold font-manrope">Worsening</span>
          </button>
        </section>

        <div className="mt-8 text-center pb-8">
          <button 
            type="button"
            onClick={handleFollowUp}
            disabled={isSubmitting}
            className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--color-primary)] text-white rounded-full shadow-2xl font-headline font-bold tracking-tight hover:opacity-90 active:scale-90 duration-150 disabled:opacity-50 cursor-pointer"
          >
            <span>{isSubmitting ? 'Saving...' : 'Submit Daily Follow-up'}</span>
            <span className="material-symbols-outlined">save</span>
          </button>
        </div>
      </main>

      <BottomNavBar />

      {/* Voice FAB */}
      <div className="fixed bottom-28 right-6 z-40">
        <button type="button" className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] shadow-[0px_12px_32px_rgba(44,105,78,0.2)] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer">
          <span className="material-symbols-outlined text-3xl">mic</span>
        </button>
      </div>
    </>
  );
}
