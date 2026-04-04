import Image from "next/image";
import Link from "next/link";
import BottomNavBar from "@/components/BottomNavBar";

export default function CaseDetail({ params }: { params: { id: string } }) {
  // Mock data for case detail
  const mockCase = {
    id: params.id,
    animal: "Bessie (Cow)",
    type: "Post-Natal Check",
    status: "Stable",
    statusColor: "bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)]",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0bT2yT4JLfFfg-uUKJDYOX5-RxM1idnEmsaY3sQIQfCA6_lJnA9vUXLVw9jEt5Vh3v-ur5iUhtT3uM8cvhiQKUcrXo0dJX0_ZA13CaDFePYwptSjXfWf_mQYXUWOkuuTUev3rrnH7GcfczLcLOITw13ZyJEBxtBNR5VlDqYzARacqhHpk2u1p3ysfHkdwjS1SfmqfPvUbdP9ejH4Aqu6yWlq75xGuVohJyByOryay-sHb1VddWZEQ3rxTEDThtFALpNB8miY-r9k",
    date: "Today",
    timeline: [
      { day: "Today", desc: "Swelling reduced, appetite normal", status: "Improving" },
      { day: "Yesterday", desc: "Administered antibiotics", status: "Unchanged" },
      { day: "2 days ago", desc: "Initial report: Lethargy", status: "Worsening" }
    ]
  };

  return (
    <>
      <header className="bg-[#f9faf6] dark:bg-stone-950 flex justify-between items-center px-6 py-4 w-full sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/cases" className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors p-2 rounded-full active:scale-95 duration-150">
            arrow_back
          </Link>
          <h1 className="text-[#0f5238] dark:text-emerald-400 font-manrope font-extrabold text-xl">
            Case #{mockCase.id}
          </h1>
        </div>
      </header>

      <main className="px-6 mt-6 max-w-4xl mx-auto space-y-8 pb-32">
        <section className="flex items-center gap-6 p-2">
          <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm relative">
            <Image
              className="object-cover"
              alt={mockCase.animal}
              fill
              src={mockCase.image}
            />
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-[var(--color-outline)] mb-1 block">
              {mockCase.date}
            </span>
            <h2 className="text-3xl font-extrabold font-manrope text-[var(--color-primary)] tracking-tight">
              {mockCase.animal}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`${mockCase.statusColor} px-3 py-1 rounded-full text-[10px] font-bold uppercase`}>
                {mockCase.status}
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-xl font-bold font-manrope px-2">Recovery Timeline</h3>
          <div className="space-y-4">
            {mockCase.timeline.map((item, idx) => (
              <div key={idx} className="bg-[var(--color-surface-container-low)] p-6 rounded-xl flex items-center justify-between group hover:bg-[var(--color-surface-container-high)] transition-colors">
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${idx === 0 ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)]'}`}>
                    {mockCase.timeline.length - idx}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{item.day}</p>
                    <p className="text-[var(--color-on-surface-variant)] text-sm">{item.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    item.status === 'Improving' ? 'bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed)]' :
                    item.status === 'Worsening' ? 'bg-[var(--color-tertiary-fixed)] text-[var(--color-on-tertiary-fixed-variant)]' :
                    'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]'
                  }`}>
                    {item.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 text-center">
          <Link href="/follow-up" className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--color-primary)] text-white rounded-full shadow-2xl font-headline font-bold tracking-tight hover:opacity-90 active:scale-90 duration-150">
            <span>Add Follow-up Update</span>
            <span className="material-symbols-outlined">add</span>
          </Link>
        </div>
      </main>

      <BottomNavBar />
    </>
  );
}
