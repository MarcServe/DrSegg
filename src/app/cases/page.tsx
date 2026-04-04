import Image from "next/image";
import Link from "next/link";
import BottomNavBar from "@/components/BottomNavBar";

export default function Cases() {
  const mockCases = [
    {
      id: "1",
      animal: "Bessie (Cow)",
      type: "Post-Natal Check",
      status: "Stable",
      statusColor: "bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)]",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0bT2yT4JLfFfg-uUKJDYOX5-RxM1idnEmsaY3sQIQfCA6_lJnA9vUXLVw9jEt5Vh3v-ur5iUhtT3uM8cvhiQKUcrXo0dJX0_ZA13CaDFePYwptSjXfWf_mQYXUWOkuuTUev3rrnH7GcfczLcLOITw13ZyJEBxtBNR5VlDqYzARacqhHpk2u1p3ysfHkdwjS1SfmqfPvUbdP9ejH4Aqu6yWlq75xGuVohJyByOryay-sHb1VddWZEQ3rxTEDThtFALpNB8miY-r9k",
      date: "Today",
    },
    {
      id: "2",
      animal: "Billy (Goat)",
      type: "Limping Observation",
      status: "Attention",
      statusColor: "bg-[var(--color-tertiary-fixed)] text-[var(--color-on-tertiary-fixed-variant)]",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAj4wt2Y0i2rIXtZRxthLQZKrbfc8TJUGxdBiI1SiBOZ0ZwpjnOgEyujT8ebPAz9U8Y8nHxeeeFTO0YGnhKhUY_j4FzQ4xkMvrMnR9AGYxiHhBe-ZKCXF0ByrRkUHj3PUtok-xyqdGdTTctwUh36xdpv7HdzcMCPYet86jYGHRycSk6rY4S5W3iPvSFrRJCEMI6dtCEMUh5zH28vQHP9NxYzlb8EVMxo1AHqIlUH5HsuRrUdd2p71zKSzluO0dBCOdSwCykGKkWA54",
      date: "Yesterday",
    },
    {
      id: "3",
      animal: "Flock A (Poultry)",
      type: "Respiratory Check",
      status: "Critical",
      statusColor: "bg-[var(--color-error-container)] text-[var(--color-on-error-container)]",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAYkxWqp6d100eeVK8cDELEafitTpjNENPFWp_HG9EC_Nqr8PZ--U_G8b_c4SYnTzeficf36waoNhWNJ3yiYv-pW3hcccLuF9tWf_DBU7bzMNO0XH_7qUw3kdh0zD-cerjUONMd549jcnT-K4nXv-WN3Lmp8So2lkomMnkPP_sy5i2XaeNWN_BoMhd-GBM5Z9_cwG99tS7c2ulE25jsielDHfl-scoOcoWxdqEgxlB_Q2YNzDSOmdxFL07VBR9jcV7kVPryU7C10DI",
      date: "2 days ago",
    }
  ];

  return (
    <>
      <header className="bg-[#f9faf6] dark:bg-stone-950 flex justify-between items-center px-6 py-4 w-full fixed top-0 z-50">
        <div className="flex items-center gap-4">
          <span className="text-[#0f5238] dark:text-emerald-400 font-manrope font-extrabold text-xl tracking-tight">
            All Cases
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 cursor-pointer hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors rounded-full p-2 active:scale-95 duration-150">
            filter_list
          </span>
        </div>
      </header>

      <main className="mt-20 px-6 pb-32 max-w-lg mx-auto w-full space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-headline font-extrabold text-[var(--color-primary)]">Active Monitoring</h2>
          <Link href="/new-case" className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-md">
            <span className="material-symbols-outlined text-sm">add</span>
            New Case
          </Link>
        </div>

        <div className="space-y-4">
          {mockCases.map((c) => (
            <Link key={c.id} href={`/case/${c.id}`} className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl flex items-center justify-between hover:bg-[var(--color-surface-container-low)] transition-colors shadow-sm border border-[var(--color-outline-variant)]/15">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden relative">
                  <Image src={c.image} alt={c.animal} fill className="object-cover" />
                </div>
                <div>
                  <p className="font-bold text-[var(--color-on-surface)] text-lg">{c.animal}</p>
                  <p className="text-sm text-[var(--color-on-surface-variant)]">{c.type}</p>
                  <p className="text-xs text-[var(--color-outline)] mt-1">{c.date}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`${c.statusColor} px-3 py-1 rounded-full text-[10px] font-bold uppercase`}>
                  {c.status}
                </span>
                <span className="material-symbols-outlined text-[var(--color-outline)]">chevron_right</span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <BottomNavBar />
    </>
  );
}
