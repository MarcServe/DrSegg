import Link from "next/link";
import BottomNavBar from "@/components/BottomNavBar";
import { AnimalIcon, animalTypeToIconKey } from "@/components/AnimalIcon";
import { AppLogo } from "@/components/AppLogo";
import { createClient } from "@/lib/supabase/server";

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

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

  let docCount = 0;
  let caseCount = 0;
  let latestDoc: { title: string; created_at: string } | null = null;
  let latestCaseRow: { animal_type: string; created_at: string } | null = null;
  let urgentCaseCount = 0;

  if (user) {
    const { data } = await supabase
      .from("cases")
      .select("id, animal_type, health_status")
      .order("created_at", { ascending: false })
      .limit(2);
    recentCases = data ?? [];

    const { count: dc } = await supabase
      .from("farm_documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    docCount = dc ?? 0;

    const { count: cc } = await supabase
      .from("cases")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    caseCount = cc ?? 0;

    const { data: ld } = await supabase
      .from("farm_documents")
      .select("title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    latestDoc = ld;

    const { data: lc } = await supabase
      .from("cases")
      .select("animal_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    latestCaseRow = lc;

    const { count: uc } = await supabase
      .from("cases")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .or("health_status.eq.critical,status.eq.escalated");
    urgentCaseCount = uc ?? 0;
  }

  let recentActivitySummary = "Farm documents and case history.";
  let recentActivityDetail = "Sign in to see saved files and timelines.";
  if (user) {
    recentActivitySummary = `${docCount} document${docCount === 1 ? "" : "s"} · ${caseCount} case${caseCount === 1 ? "" : "s"}`;
    if (docCount === 0 && caseCount === 0) {
      recentActivityDetail = "No activity yet — upload on Records or start a case.";
    } else {
      const docTime = latestDoc?.created_at ? new Date(latestDoc.created_at).getTime() : 0;
      const caseTime = latestCaseRow?.created_at ? new Date(latestCaseRow.created_at).getTime() : 0;
      if (latestDoc && (!latestCaseRow || docTime >= caseTime)) {
        recentActivityDetail = `Latest: ${truncate(latestDoc.title, 28)} · ${formatRelative(latestDoc.created_at)}`;
      } else if (latestCaseRow) {
        recentActivityDetail = `Latest case: ${latestCaseRow.animal_type} · ${formatRelative(latestCaseRow.created_at)}`;
      }
    }
  }

  let emergencySummary = "First aid & escalation.";
  let emergencyDetail = "Sign in to see if any case needs urgent follow-up.";
  if (user) {
    if (urgentCaseCount > 0) {
      emergencySummary = `${urgentCaseCount} urgent`;
      emergencyDetail =
        urgentCaseCount === 1
          ? "One case is flagged critical or escalated — open Cases."
          : `${urgentCaseCount} cases need urgent follow-up.`;
    } else {
      emergencySummary = "All clear";
      emergencyDetail = "No critical or escalated cases. Review protocols anytime.";
    }
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
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/new-case?animal=poultry"
              className="bg-[var(--color-surface-container-low)] p-4 sm:p-5 rounded-xl flex flex-col items-center gap-3 hover:bg-[var(--color-surface-container-high)] transition-colors cursor-pointer"
            >
              <div className="w-full max-w-[160px] aspect-square flex items-center justify-center">
                <AnimalIcon animal="poultry" size={160} label="Poultry" />
              </div>
              <span className="text-sm font-bold text-[var(--color-on-secondary-container)]">Poultry</span>
            </Link>
            <Link
              href="/new-case?animal=goat"
              className="bg-[var(--color-surface-container-low)] p-4 sm:p-5 rounded-xl flex flex-col items-center gap-3 hover:bg-[var(--color-surface-container-high)] transition-colors cursor-pointer"
            >
              <div className="w-full max-w-[160px] aspect-square flex items-center justify-center">
                <AnimalIcon animal="goat" size={160} label="Goat" />
              </div>
              <span className="text-sm font-bold text-[var(--color-on-secondary-container)]">Goat</span>
            </Link>
            <Link
              href="/new-case?animal=pig"
              className="bg-[var(--color-surface-container-low)] p-4 sm:p-5 rounded-xl flex flex-col items-center gap-3 hover:bg-[var(--color-surface-container-high)] transition-colors cursor-pointer"
            >
              <div className="w-full max-w-[160px] aspect-square flex items-center justify-center">
                <AnimalIcon animal="pig" size={160} label="Pig" />
              </div>
              <span className="text-sm font-bold text-[var(--color-on-secondary-container)]">Pig</span>
            </Link>
            <Link
              href="/new-case?animal=dog"
              className="bg-[var(--color-surface-container-low)] p-4 sm:p-5 rounded-xl flex flex-col items-center gap-3 hover:bg-[var(--color-surface-container-high)] transition-colors cursor-pointer"
            >
              <div className="w-full max-w-[160px] aspect-square flex items-center justify-center">
                <AnimalIcon animal="dog" size={160} label="Dog" />
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
                {user && caseCount > 0 ? `View all (${caseCount})` : "View all"}
              </Link>
            </div>
            {user && caseCount > 2 ? (
              <p className="text-xs text-[var(--color-outline)] -mt-2">
                Showing your 2 most recent cases — open the full list for all.
              </p>
            ) : null}
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
                  const iconKey = animalTypeToIconKey(c.animal_type);
                  return (
                    <Link
                      key={c.id}
                      href={`/case/${c.id}`}
                      className="bg-[var(--color-surface-container-low)] p-4 rounded-lg flex items-center justify-between hover:bg-[var(--color-surface-container-high)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden relative bg-[var(--color-surface-container-highest)] flex items-center justify-center shrink-0">
                          {iconKey ? (
                            <AnimalIcon
                              animal={iconKey}
                              size={48}
                              label={c.animal_type}
                              className="max-h-12"
                            />
                          ) : (
                            <span className="text-lg font-bold text-[var(--color-primary)] capitalize">
                              {c.animal_type.charAt(0)}
                            </span>
                          )}
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
            className="bg-[var(--color-surface-container)] p-6 rounded-xl space-y-3 block cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all min-h-[156px] flex flex-col"
          >
            <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl">history</span>
            <div className="flex-1 min-h-0">
              <h3 className="font-headline font-bold text-[var(--color-on-surface)]">Recent Activity</h3>
              <p className="text-sm font-semibold text-[var(--color-on-surface)] mt-1 leading-snug">
                {recentActivitySummary}
              </p>
              <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed mt-1 line-clamp-3">
                {recentActivityDetail}
              </p>
            </div>
          </Link>

          <Link
            href={user && urgentCaseCount > 0 ? "/cases" : "/guided-inspection"}
            className="bg-[var(--color-error-container)] p-6 rounded-xl space-y-3 flex flex-col justify-between cursor-pointer hover:opacity-95 active:scale-[0.98] transition-all min-h-[156px]"
          >
            <span className="material-symbols-outlined text-[var(--color-error)] text-3xl filled-icon">
              emergency_home
            </span>
            <div>
              <h3 className="font-headline font-bold text-[var(--color-on-error-container)]">Emergency Guide</h3>
              <p className="text-sm font-semibold text-[var(--color-on-error-container)] mt-1 leading-snug">
                {emergencySummary}
              </p>
              <p className="text-xs text-[var(--color-on-error-container)]/80 mt-1 leading-relaxed line-clamp-3">
                {emergencyDetail}
              </p>
            </div>
          </Link>
        </section>
      </main>

      <BottomNavBar />
    </>
  );
}
