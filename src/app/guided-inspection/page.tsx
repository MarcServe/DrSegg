import Image from "next/image";
import Link from "next/link";
import BottomNavBar from "@/components/BottomNavBar";
import { AppLogo } from "@/components/AppLogo";

export default function GuidedInspection() {
  return (
    <>
      {/* Header Navigation Shell (TopAppBar) */}
      <header className="flex justify-between items-center px-6 py-4 w-full bg-[var(--color-surface-container-low)] dark:bg-stone-900 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/health-status" className="p-2 rounded-full hover:bg-[#e2e3df] transition-colors active:scale-95 duration-150">
            <span className="material-symbols-outlined text-[#0f5238]">close</span>
          </Link>
          <AppLogo href="/" size={104} />
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
        {/* Progress Indicator */}
        <Link href="/analysis-result" className="mb-10 px-2 block cursor-pointer active:scale-[0.99]">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-[var(--color-on-surface-variant)] font-label text-sm font-bold uppercase tracking-widest">
                Inspection Progress
              </p>
              <p className="font-headline font-extrabold text-2xl text-[var(--color-primary)] mt-1">
                Step 2 of 5
              </p>
            </div>
            <div className="text-right">
              <p className="text-[var(--color-on-surface-variant)] font-body text-sm font-medium">
                Herd ID: #8821
              </p>
            </div>
          </div>
          <div className="h-3 w-full bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
              style={{ width: "40%" }}
            ></div>
          </div>
        </Link>

        {/* Main Inspection Content Canvas */}
        <section className="space-y-8">
          {/* Step Card */}
          <button type="button" className="w-full bg-[var(--color-surface-container-lowest)] rounded-xl p-8 shadow-[0px_12px_32px_rgba(44,105,78,0.08)] relative overflow-hidden text-left cursor-pointer hover:bg-[var(--color-surface-container-low)] active:scale-[0.99]">
            {/* Tonal layering background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary-fixed)]/20 rounded-bl-[5rem] -mr-8 -mt-8"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-[var(--color-primary-fixed)] px-4 py-1.5 rounded-full mb-6">
                <span className="material-symbols-outlined text-[var(--color-on-primary-fixed)] filled-icon">
                  visibility
                </span>
                <span className="text-[var(--color-on-primary-fixed)] font-headline font-bold text-sm uppercase tracking-wide">
                  Inspection Point
                </span>
              </div>
              <h2 className="font-manrope text-4xl font-extrabold text-[var(--color-on-surface)] mb-4">
                The Eyes
              </h2>
              <p className="text-lg text-[var(--color-on-surface-variant)] leading-relaxed max-w-md">
                Check both eyes closely. Are you seeing any{" "}
                <span className="font-bold text-[var(--color-on-surface)]">
                  discharge, cloudiness, or unusual redness
                </span>{" "}
                around the socket?
              </p>
            </div>
            {/* Reference Image */}
            <div className="mt-8 rounded-lg overflow-hidden border-4 border-[var(--color-surface-container-high)] relative h-64">
              <Image
                alt="Reference photo of cow's eye"
                className="object-cover"
                fill
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqWu0l6wXIjOFVI4VZkhUqPNsN2wSlHD43sTTM1yFwf_ev3EFZDdaZTVRPiF3tNqoyQEcBumYgW5SdTYd5oBP2-UilJlEDUYf1tJ0CrtggfUhu65PjS1N6M0SY5WUYlH3_6-jlyce6njohS_j3m9Kdt-2HsRdpAfUs-QxRcU-0lTmORPdWxhrAnrbtjFhd_A5o6h5dRsn4A_P2IzXKmZ-iuyK7enPKGHZRE72eAhAewjMeaNylH48AFnCI5npL0bCPT2O4fCMO6Kg"
              />
            </div>
            {/* Quick Tips Surface Layer */}
            <div className="mt-6 p-5 bg-[var(--color-surface-container-low)] rounded-lg flex items-start gap-4">
              <span className="material-symbols-outlined text-[var(--color-primary-container)]">info</span>
              <div>
                <p className="font-bold text-[var(--color-on-surface-variant)] text-sm uppercase">Expert Tip</p>
                <p className="text-[var(--color-on-surface-variant)] text-sm mt-1">
                  Healthy eyes should be bright, clear, and alert. Avoid recording in direct midday glare if possible.
                </p>
              </div>
            </div>
          </button>

          {/* Action Area: The Pulse */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/analysis-result" className="flex items-center justify-center gap-3 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white py-6 px-8 rounded-full shadow-[0px_12px_32px_rgba(44,105,78,0.2)] active:scale-95 transition-all group cursor-pointer">
              <span className="material-symbols-outlined text-3xl group-active:scale-110 transition-transform">
                photo_camera
              </span>
              <span className="font-headline font-bold text-lg">Take Photo</span>
            </Link>
            <button type="button" className="flex items-center justify-center gap-3 bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)] py-6 px-8 rounded-full active:scale-95 transition-all group cursor-pointer w-full md:w-auto">
              <span className="material-symbols-outlined text-3xl">videocam</span>
              <span className="font-headline font-bold text-lg">Record Video</span>
            </button>
          </div>

          {/* Skip/Manual Note Link */}
          <div className="text-center pt-4">
            <button type="button" className="text-[var(--color-on-surface-variant)] font-bold text-sm uppercase tracking-widest hover:text-[var(--color-primary)] transition-colors cursor-pointer">
              Add Text Note Instead
            </button>
          </div>
        </section>
      </main>

      <BottomNavBar />
    </>
  );
}
