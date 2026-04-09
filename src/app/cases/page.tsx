import Image from "next/image";
import Link from "next/link";
import BottomNavBar from "@/components/BottomNavBar";
import { createClient } from "@/lib/supabase/server";

const PLACEHOLDER =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD0bT2yT4JLfFfg-uUKJDYOX5-RxM1idnEmsaY3sQIQfCA6_lJnA9vUXLVw9jEt5Vh3v-ur5iUhtT3uM8cvhiQKUcrXo0dJX0_ZA13CaDFePYwptSjXfWf_mQYXUWOkuuTUev3rrnH7GcfczLcLOITw13ZyJEBxtBNR5VlDqYzARacqhHpk2u1p3ysfHkdwjS1SfmqfPvUbdP9ejH4Aqu6yWlq75xGuVohJyByOryay-sHb1VddWZEQ3rxTEDThtFALpNB8miY-r9k";

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

export default async function Cases() {
  const supabase = await createClient();
  const { data: cases } = await supabase
    .from("cases")
    .select("id, animal_type, health_status, created_at")
    .order("created_at", { ascending: false });

  const list = cases ?? [];

  return (
    <>
      <header className="bg-[#f9faf6] dark:bg-stone-950 flex justify-between items-center px-6 py-4 w-full fixed top-0 z-50">
        <Link href="/" className="flex items-center gap-4 cursor-pointer hover:opacity-80">
          <span className="text-[#0f5238] dark:text-emerald-400 font-manrope font-extrabold text-xl tracking-tight">
            All Cases
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Filter cases"
            className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 cursor-pointer hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors rounded-full p-2 active:scale-95 duration-150"
          >
            filter_list
          </button>
        </div>
      </header>

      <main className="mt-20 px-6 pb-32 max-w-lg mx-auto w-full space-y-6">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-2xl font-headline font-extrabold text-[var(--color-primary)] cursor-pointer hover:underline">
            Active Monitoring
          </Link>
          <Link
            href="/new-case"
            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-md"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Case
          </Link>
        </div>

        {list.length === 0 ? (
          <p className="text-[var(--color-on-surface-variant)]">
            No cases yet.{" "}
            <Link href="/new-case" className="font-bold text-[var(--color-primary)]">
              Create your first case
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-4">
            {list.map((c) => {
              const badge = statusBadge(c.health_status);
              const date = c.created_at
                ? new Date(c.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "";
              return (
                <Link
                  key={c.id}
                  href={`/case/${c.id}`}
                  className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl flex items-center justify-between hover:bg-[var(--color-surface-container-low)] transition-colors shadow-sm border border-[var(--color-outline-variant)]/15"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden relative">
                      <Image src={PLACEHOLDER} alt={c.animal_type} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--color-on-surface)] text-lg capitalize">
                        {c.animal_type}
                      </p>
                      <p className="text-sm text-[var(--color-on-surface-variant)] capitalize">
                        {c.health_status?.replace(/_/g, " ") ?? "Recorded"}
                      </p>
                      <p className="text-xs text-[var(--color-outline)] mt-1">{date}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`${badge.className} px-3 py-1 rounded-full text-[10px] font-bold uppercase`}
                    >
                      {badge.text}
                    </span>
                    <span className="material-symbols-outlined text-[var(--color-outline)]">
                      chevron_right
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNavBar />
    </>
  );
}
