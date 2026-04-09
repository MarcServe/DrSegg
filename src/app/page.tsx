import Image from "next/image";
import Link from "next/link";
import BottomNavBar from "@/components/BottomNavBar";
import { AppLogo } from "@/components/AppLogo";
import { FaDog } from "react-icons/fa";
import { GiChicken, GiGoat, GiPig } from "react-icons/gi";
import { createClient } from "@/lib/supabase/server";

const PLACEHOLDER =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD0bT2yT4JLfFfg-uUKJDYOX5-RxM1idnEmsaY3sQIQfCA6_lJnA9vUXLVw9jEt5Vh3v-ur5iUhtT3uM8cvhiQKUcrXo0dJX0_ZA13CaDFePYwptSjXfWf_mQYXUWOkuuTUev3rrnH7GcfczLcLOITw13ZyJEBxtBNR5VlDqYzARacqhHpk2u1p3ysfHkdwjS1SfmqfPvUbdP9ejH4Aqu6yWlq75xGuVohJyByOryay-sHb1VddWZEQ3rxTEDThtFALpNB8miY-r9k";

function statusLabel(health: string | null) {
  switch (health) {
    case "healthy":
      return { text: "Stable", className: "bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)]" };
    case "mild_concern":
      return { text: "Monitor", className: "bg-yellow-100 text-yellow-900" };
    case "likely_sick":
      return { text: "Attention", className: "bg-[var(--color-tertiary-fixed)] text-[var(--color-on-tertiary-fixed-variant)]" };
    case "critical":
      return { text: "Critical", className: "bg-[var(--color-error-container)] text-[var(--color-on-error-container)]" };
    default:
      return { text: "Open", className: "bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)]" };
  }
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let recentCases: {
    id: string;
    animal_type: string;
    health_status: string | null;
  }[] = [];

  if (user) {
    const { data } = await supabase
      .from("cases")
      .select("id, animal_type, health_status")
      .order("created_at", { ascending: false })
      .limit(2);
    recentCases = data ?? [];
  }

  return (
    <>
      <header className="bg-[#f9faf6] dark:bg-stone-950 flex justify-between items-center px-6 py-4 w-full fixed top-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            href="/cases"
            aria-label="Open cases"
            className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 cursor-pointer hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors rounded-full p-2 active:scale-95 duration-150"
          >
            menu
          </Link>
          <AppLogo href="/" size={56} />
        </div>
        <div className="flex items-center">
          <Link
            href={user ? "/profile" : "/login"}
            aria-label="Settings"
            className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 cursor-pointer hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors rounded-full p-2 active:scale-95 duration-150"
          >
            settings
          </Link>
        </div>
      </header>

      <main className="mt-20 px-6 pb-32 max-w-lg mx-auto w-full space-y-10">
        <section className="mt-8">
          <Link href="/new-case" className="block cursor-pointer active:scale-[0.99] transition-transform">
            <h1 className="text-4xl font-headline font-extrabold text-[var(--color-primary)] leading-tight hover:opacity-90">
              Hello, how can I help your animals today?
            </h1>
          </Link>
        </section>

        <section>
          <Link
            href="/new-case"
            className="block w-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-[var(--color-on-primary)] py-8 rounded-xl shadow-[0px_12px_32px_rgba(44,105,78,0.15)] flex flex-col items-center justify-center gap-4 active:scale-95 transition-all"
          >
            <div className="bg-white/20 p-6 rounded-full backdrop-blur-md">
              <span className="material-symbols-outlined text-5xl filled-icon">mic</span>
            </div>
            <span className="font-headline text-2xl font-bold tracking-wide">Check an Animal</span>
          </Link>
        </section>

        <section className="space-y-4">
          <Link href="/new-case" className="block px-1 cursor-pointer">
            <h2 className="text-xl font-headline font-bold text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">
              Animal Quick Access
            </h2>
          </Link>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/new-case?animal=poultry"
              className="bg-[var(--color-surface-container-low)] p-5 rounded-xl flex flex-col items-center gap-2 hover:bg-[var(--color-surface-container-high)] transition-colors cursor-pointer"
            >
              <div className="text-[var(--color-primary)]">
                <GiChicken size={36} />
              </div>
              <span className="text-sm font-bold text-[var(--color-on-secondary-container)]">Poultry</span>
            </Link>
            <Link
              href="/new-case?animal=goat"
              className="bg-[var(--color-surface-container-low)] p-5 rounded-xl flex flex-col items-center gap-2 hover:bg-[var(--color-surface-container-high)] transition-colors cursor-pointer"
            >
              <div className="text-[var(--color-primary)]">
                <GiGoat size={36} />
              </div>
              <span className="text-sm font-bold text-[var(--color-on-secondary-container)]">Goat</span>
            </Link>
            <Link
              href="/new-case?animal=pig"
              className="bg-[var(--color-surface-container-low)] p-5 rounded-xl flex flex-col items-center gap-2 hover:bg-[var(--color-surface-container-high)] transition-colors cursor-pointer"
            >
              <div className="text-[var(--color-primary)]">
                <GiPig size={36} />
              </div>
              <span className="text-sm font-bold text-[var(--color-on-secondary-container)]">Pig</span>
            </Link>
            <Link
              href="/new-case?animal=dog"
              className="bg-[var(--color-surface-container-low)] p-5 rounded-xl flex flex-col items-center gap-2 hover:bg-[var(--color-surface-container-high)] transition-colors cursor-pointer"
            >
              <div className="text-[var(--color-primary)]">
                <FaDog size={36} />
              </div>
              <span className="text-sm font-bold text-[var(--color-on-secondary-container)]">Dog</span>
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div className="col-span-2 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <Link
                href="/cases"
                className="text-lg font-headline font-bold text-[var(--color-primary)] cursor-pointer hover:underline"
              >
                Ongoing Cases
              </Link>
              <Link
                href="/cases"
                className="text-xs font-bold uppercase tracking-widest text-[var(--color-outline)] cursor-pointer hover:text-[var(--color-primary)]"
              >
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {!user && (
                <p className="text-sm text-[var(--color-on-surface-variant)]">
                  <Link href="/login" className="font-bold text-[var(--color-primary)] underline">
                    Sign in
                  </Link>{" "}
                  to see your cases here.
                </p>
              )}
              {user && recentCases.length === 0 && (
                <p className="text-sm text-[var(--color-on-surface-variant)]">
                  No cases yet. Start with{" "}
                  <Link href="/new-case" className="font-bold text-[var(--color-primary)]">
                    Check an Animal
                  </Link>
                  .
                </p>
              )}
              {user &&
                recentCases.map((c) => {
                  const badge = statusLabel(c.health_status);
                  return (
                    <Link
                      key={c.id}
                      href={`/case/${c.id}`}
                      className="bg-[var(--color-surface-container-low)] p-4 rounded-lg flex items-center justify-between hover:bg-[var(--color-surface-container-high)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden relative bg-[var(--color-surface-container-highest)]">
                          <Image
                            className="object-cover"
                            alt={c.animal_type}
                            fill
                            src={PLACEHOLDER}
                          />
                        </div>
                        <div>
                          <p className="font-bold text-[var(--color-on-surface)] capitalize">
                            {c.animal_type}
                          </p>
                          <p className="text-sm text-[var(--color-on-surface-variant)] capitalize">
                            {c.health_status?.replace(/_/g, " ") ?? "Assessment"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`${badge.className} px-3 py-1 rounded-full text-[10px] font-bold uppercase`}
                      >
                        {badge.text}
                      </span>
                    </Link>
                  );
                })}
            </div>
          </div>

          <Link
            href="/records"
            className="bg-[var(--color-surface-container)] p-6 rounded-xl space-y-3 block cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl">history</span>
            <h3 className="font-headline font-bold text-[var(--color-on-surface)]">Recent Activity</h3>
            <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed">
              Farm documents and case exports.
            </p>
          </Link>

          <Link
            href="/guided-inspection"
            className="bg-[var(--color-error-container)] p-6 rounded-xl space-y-3 flex flex-col justify-between cursor-pointer hover:opacity-95 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[var(--color-error)] text-3xl filled-icon">
              emergency_home
            </span>
            <div>
              <h3 className="font-headline font-bold text-[var(--color-on-error-container)]">Emergency Guide</h3>
              <p className="text-xs text-[var(--color-on-error-container)]/70 mt-1">Critical protocols.</p>
            </div>
          </Link>
        </section>
      </main>

      <BottomNavBar />
    </>
  );
}
