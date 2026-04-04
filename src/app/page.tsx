import Image from "next/image";
import Link from "next/link";
import BottomNavBar from "@/components/BottomNavBar";
import { GiChicken, GiGoat, GiPig } from "react-icons/gi";

export default function Home() {
  return (
    <>
      {/* TopAppBar */}
      <header className="bg-[#f9faf6] dark:bg-stone-950 flex justify-between items-center px-6 py-4 w-full fixed top-0 z-50">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 cursor-pointer hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors rounded-full p-2 active:scale-95 duration-150">
            menu
          </span>
          <span className="text-[#0f5238] dark:text-emerald-400 font-manrope font-extrabold text-xl tracking-tight">
            Dr Segg
          </span>
        </div>
        <div className="flex items-center">
          <span className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 cursor-pointer hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors rounded-full p-2 active:scale-95 duration-150">
            settings
          </span>
        </div>
      </header>

      <main className="mt-20 px-6 pb-32 max-w-lg mx-auto w-full space-y-10">
        {/* Greeting & Context */}
        <section className="mt-8">
          <h1 className="text-4xl font-headline font-extrabold text-[var(--color-primary)] leading-tight">
            Hello, how can I help your animals today?
          </h1>
        </section>

        {/* Primary Voice CTA */}
        <section>
          <Link href="/new-case" className="block w-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-[var(--color-on-primary)] py-8 rounded-xl shadow-[0px_12px_32px_rgba(44,105,78,0.15)] flex flex-col items-center justify-center gap-4 active:scale-95 transition-all">
            <div className="bg-white/20 p-6 rounded-full backdrop-blur-md">
              <span className="material-symbols-outlined text-5xl filled-icon">mic</span>
            </div>
            <span className="font-headline text-2xl font-bold tracking-wide">Check an Animal</span>
          </Link>
        </section>

        {/* Quick Access Tiles */}
        <section className="space-y-4">
          <h2 className="text-xl font-headline font-bold text-[var(--color-on-surface-variant)] px-1">
            Animal Quick Access
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <Link href="/new-case?animal=poultry" className="bg-[var(--color-surface-container-low)] p-5 rounded-xl flex flex-col items-center gap-2 hover:bg-[var(--color-surface-container-high)] transition-colors cursor-pointer">
              <div className="text-[var(--color-primary)]">
                <GiChicken size={36} />
              </div>
              <span className="text-sm font-bold text-[var(--color-on-secondary-container)]">Poultry</span>
            </Link>
            <Link href="/new-case?animal=goat" className="bg-[var(--color-surface-container-low)] p-5 rounded-xl flex flex-col items-center gap-2 hover:bg-[var(--color-surface-container-high)] transition-colors cursor-pointer">
              <div className="text-[var(--color-primary)]">
                <GiGoat size={36} />
              </div>
              <span className="text-sm font-bold text-[var(--color-on-secondary-container)]">Goat</span>
            </Link>
            <Link href="/new-case?animal=pig" className="bg-[var(--color-surface-container-low)] p-5 rounded-xl flex flex-col items-center gap-2 hover:bg-[var(--color-surface-container-high)] transition-colors cursor-pointer">
              <div className="text-[var(--color-primary)]">
                <GiPig size={36} />
              </div>
              <span className="text-sm font-bold text-[var(--color-on-secondary-container)]">Pig</span>
            </Link>
          </div>
        </section>

        {/* Ongoing Cases & Recent Activity (Bento Layout) */}
        <section className="grid grid-cols-2 gap-4">
          {/* Ongoing Cases */}
          <div className="col-span-2 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-headline font-bold text-[var(--color-primary)]">Ongoing Cases</h2>
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-outline)]">View All</span>
            </div>
            <div className="space-y-4">
              <Link href="/case/1" className="bg-[var(--color-surface-container-low)] p-4 rounded-lg flex items-center justify-between hover:bg-[var(--color-surface-container-high)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden relative">
                    <Image
                      className="object-cover"
                      alt="Cow"
                      fill
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0bT2yT4JLfFfg-uUKJDYOX5-RxM1idnEmsaY3sQIQfCA6_lJnA9vUXLVw9jEt5Vh3v-ur5iUhtT3uM8cvhiQKUcrXo0dJX0_ZA13CaDFePYwptSjXfWf_mQYXUWOkuuTUev3rrnH7GcfczLcLOITw13ZyJEBxtBNR5VlDqYzARacqhHpk2u1p3ysfHkdwjS1SfmqfPvUbdP9ejH4Aqu6yWlq75xGuVohJyByOryay-sHb1VddWZEQ3rxTEDThtFALpNB8miY-r9k"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-[var(--color-on-surface)]">Bessie (Cow)</p>
                    <p className="text-sm text-[var(--color-on-surface-variant)]">Post-Natal Check</p>
                  </div>
                </div>
                <span className="bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)] px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                  Stable
                </span>
              </Link>
              <Link href="/case/2" className="bg-[var(--color-surface-container-low)] p-4 rounded-lg flex items-center justify-between hover:bg-[var(--color-surface-container-high)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden relative">
                    <Image
                      className="object-cover"
                      alt="Goat"
                      fill
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAj4wt2Y0i2rIXtZRxthLQZKrbfc8TJUGxdBiI1SiBOZ0ZwpjnOgEyujT8ebPAz9U8Y8nHxeeeFTO0YGnhKhUY_j4FzQ4xkMvrMnR9AGYxiHhBe-ZKCXF0ByrRkUHj3PUtok-xyqdGdTTctwUh36xdpv7HdzcMCPYet86jYGHRycSk6rY4S5W3iPvSFrRJCEMI6dtCEMUh5zH28vQHP9NxYzlb8EVMxo1AHqIlUH5HsuRrUdd2p71zKSzluO0dBCOdSwCykGKkWA54"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-[var(--color-on-surface)]">Billy (Goat)</p>
                    <p className="text-sm text-[var(--color-on-surface-variant)]">Limping Observation</p>
                  </div>
                </div>
                <span className="bg-[var(--color-tertiary-fixed)] text-[var(--color-on-tertiary-fixed-variant)] px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                  Attention
                </span>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[var(--color-surface-container)] p-6 rounded-xl space-y-3">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl">history</span>
            <h3 className="font-headline font-bold text-[var(--color-on-surface)]">Recent Activity</h3>
            <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed">
              Vaccination logs updated for Herd 04.
            </p>
          </div>

          {/* Emergency Guide Card */}
          <div className="bg-[var(--color-error-container)] p-6 rounded-xl space-y-3 flex flex-col justify-between">
            <span className="material-symbols-outlined text-[var(--color-error)] text-3xl filled-icon">
              emergency_home
            </span>
            <div>
              <h3 className="font-headline font-bold text-[var(--color-on-error-container)]">Emergency Guide</h3>
              <p className="text-xs text-[var(--color-on-error-container)]/70 mt-1">Critical protocols.</p>
            </div>
          </div>
        </section>
      </main>

      <BottomNavBar />
    </>
  );
}
