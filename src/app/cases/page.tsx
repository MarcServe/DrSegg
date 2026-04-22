import Link from "next/link";
import BottomNavBar from "@/components/BottomNavBar";
import { AnimalIcon, animalTypeToIconKey } from "@/components/AnimalIcon";
import { createClient } from "@/lib/supabase/server";
import { isMissingDisplayNameColumn } from "@/lib/case-detail-select";

export const dynamic = "force-dynamic";

type CaseRow = {
  id: string;
  animal_type: string;
  health_status: string | null;
  created_at: string | null;
  display_name: string | null;
  monitoring_active?: boolean | null;
  last_activity_at?: string | null;
};

function statusBadge(health: string | null) {
  switch (health) {
    case "healthy":
      return {
        text: "Stable",
        className: "bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)]",
      };
    case "mild_concern":
      return { text: "Monitor", className: "bg-yellow-100 text-yellow-900" };
    case "likely_sick":
      return {
        text: "Attention",
        className: "bg-[var(--color-tertiary-fixed)] text-[var(--color-on-tertiary-fixed-variant)]",
      };
    case "critical":
      return {
        text: "Critical",
        className: "bg-[var(--color-error-container)] text-[var(--color-on-error-container)]",
      };
    default:
      return {
        text: "Open",
        className: "bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)]",
      };
  }
}

function sortByRecent(a: CaseRow, b: CaseRow): number {
  const ta = new Date(a.last_activity_at || a.created_at || 0).getTime();
  const tb = new Date(b.last_activity_at || b.created_at || 0).getTime();
  return tb - ta;
}

function CaseCard({ c }: { c: CaseRow }) {
  const iconKey = animalTypeToIconKey(c.animal_type);
  const badge = statusBadge(c.health_status);
  const date = c.last_activity_at || c.created_at;
  const dateLabel = date
    ? new Date(date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";
  return (
    <Link
      href={`/case/${c.id}`}
      className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl flex items-center justify-between hover:bg-[var(--color-surface-container-low)] transition-colors shadow-sm border border-[var(--color-outline-variant)]/15"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-14 h-14 rounded-full overflow-hidden relative bg-[var(--color-surface-container-highest)] flex items-center justify-center shrink-0">
          {iconKey ? (
            <AnimalIcon animal={iconKey} size={56} label={c.animal_type} />
          ) : (
            <span className="material-symbols-outlined text-3xl text-[var(--color-primary)]">pets</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-[var(--color-on-surface)] text-lg capitalize truncate">
            {c.display_name?.trim() || c.animal_type}
          </p>
          <p className="text-sm text-[var(--color-on-surface-variant)] capitalize">
            {c.health_status?.replace(/_/g, " ") ?? "Recorded"}
          </p>
          <p className="text-xs text-[var(--color-outline)] mt-1">Last activity · {dateLabel}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className={`${badge.className} px-3 py-1 rounded-full text-[10px] font-bold uppercase`}>
          {badge.text}
        </span>
        <span className="material-symbols-outlined text-[var(--color-outline)]">chevron_right</span>
      </div>
    </Link>
  );
}

export default async function Cases() {
  const supabase = await createClient();
  const select =
    "id, animal_type, health_status, created_at, display_name, monitoring_active, last_activity_at";

  let { data: cases, error: casesErr } = await supabase
    .from("cases")
    .select(select)
    .order("created_at", { ascending: false })
    .limit(10000);

  if (casesErr && isMissingDisplayNameColumn(casesErr)) {
    const r2 = await supabase
      .from("cases")
      .select("id, animal_type, health_status, created_at, monitoring_active, last_activity_at")
      .order("created_at", { ascending: false })
      .limit(10000);
    cases = r2.data?.map((c) => ({ ...c, display_name: null as string | null })) ?? [];
    casesErr = r2.error;
  }

  if (casesErr && (casesErr.message ?? "").toLowerCase().includes("monitoring_active")) {
    const r3 = await supabase
      .from("cases")
      .select("id, animal_type, health_status, created_at, display_name")
      .order("created_at", { ascending: false })
      .limit(10000);
    cases =
      r3.data?.map((c) => ({
        ...c,
        monitoring_active: true as boolean,
        last_activity_at: c.created_at,
      })) ?? [];
  }

  const list: CaseRow[] = (cases ?? []) as CaseRow[];
  const active = [...list].filter((c) => c.monitoring_active !== false).sort(sortByRecent);
  const older = [...list].filter((c) => c.monitoring_active === false).sort(sortByRecent);

  return (
    <>
      <header className="bg-[#f9faf6] dark:bg-stone-950 flex justify-between items-center px-6 py-4 w-full fixed top-0 z-50">
        <Link href="/" className="flex items-center gap-4 cursor-pointer hover:opacity-80">
          <span className="text-[#0f5238] dark:text-emerald-400 font-manrope font-extrabold text-xl tracking-tight">
            Cases
          </span>
        </Link>
        <div className="flex items-center gap-2" aria-hidden>
          <span className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500">assignment</span>
        </div>
      </header>

      <main className="mt-20 px-6 pb-32 max-w-lg mx-auto w-full space-y-8">
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-headline font-extrabold text-[var(--color-on-surface)]">Your cases</h1>
          <Link
            href="/new-case"
            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-md shrink-0"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New case
          </Link>
        </div>

        <p className="text-sm text-[var(--color-on-surface-variant)] -mt-4">
          <span className="font-bold text-[var(--color-on-surface)]">{list.length} total</span> · {active.length}{" "}
          in active monitoring
          {older.length > 0 ? ` · ${older.length} older` : ""}. New analyses and follow-ups bump &quot;last
          activity&quot; and keep cases easy to find.
        </p>

        {list.length === 0 ? (
          <p className="text-[var(--color-on-surface-variant)]">
            No cases yet.{" "}
            <Link href="/new-case" className="font-bold text-[var(--color-primary)]">
              Run a check
            </Link>{" "}
            to create one (you must be signed in and complete analysis).
          </p>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-lg font-headline font-bold text-[var(--color-primary)] px-1">Actively monitoring</h2>
              {active.length === 0 ? (
                <p className="text-sm text-[var(--color-on-surface-variant)] px-1">
                  No cases in this list — use &quot;Show in active monitoring again&quot; on a case, or you only have
                  older cases below.
                </p>
              ) : (
                <div className="space-y-4">
                  {active.map((c) => (
                    <CaseCard key={c.id} c={c} />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-headline font-bold text-[var(--color-on-surface)] px-1">
                Older / not actively monitoring
              </h2>
              {older.length === 0 ? (
                <p className="text-sm text-[var(--color-on-surface-variant)] px-1">
                  Nothing here yet. Move a case here from its case file when you are no longer tracking it day to day.
                </p>
              ) : (
                <div className="space-y-4">
                  {older.map((c) => (
                    <CaseCard key={c.id} c={c} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <BottomNavBar />
    </>
  );
}
