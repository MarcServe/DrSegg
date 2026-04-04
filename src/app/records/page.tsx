import BottomNavBar from "@/components/BottomNavBar";

export default function Records() {
  const mockRecords = [
    { id: 1, title: "Herd Vaccination Log", date: "Oct 15, 2026", type: "PDF" },
    { id: 2, title: "Quarterly Health Report", date: "Sep 30, 2026", type: "PDF" },
    { id: 3, title: "Feed Supplier Receipt", date: "Sep 12, 2026", type: "Image" },
    { id: 4, title: "Dr Segg Case #2084", date: "Aug 22, 2026", type: "Report" },
  ];

  return (
    <>
      <header className="bg-[#f9faf6] dark:bg-stone-950 flex justify-between items-center px-6 py-4 w-full fixed top-0 z-50">
        <div className="flex items-center gap-4">
          <span className="text-[#0f5238] dark:text-emerald-400 font-manrope font-extrabold text-xl tracking-tight">
            Medical Records
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 cursor-pointer hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors rounded-full p-2 active:scale-95 duration-150">
            search
          </span>
        </div>
      </header>

      <main className="mt-20 px-6 pb-32 max-w-lg mx-auto w-full space-y-6">
        <div className="bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] p-6 rounded-xl flex items-center justify-between shadow-md">
          <div>
            <h2 className="font-headline font-bold text-xl">Upload New Record</h2>
            <p className="text-sm opacity-80 mt-1">Keep all farm documents in one place</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
            <span className="material-symbols-outlined text-2xl">upload_file</span>
          </div>
        </div>

        <div className="space-y-4 mt-8">
          <h3 className="font-headline font-bold text-[var(--color-on-surface-variant)] text-lg">Recent Documents</h3>
          {mockRecords.map((record) => (
            <div key={record.id} className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl flex items-center justify-between hover:bg-[var(--color-surface-container-low)] transition-colors shadow-sm border border-[var(--color-outline-variant)]/15 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--color-surface-container-highest)] rounded-full flex items-center justify-center text-[var(--color-primary)]">
                  <span className="material-symbols-outlined">
                    {record.type === "PDF" ? "picture_as_pdf" : record.type === "Image" ? "image" : "description"}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-[var(--color-on-surface)]">{record.title}</p>
                  <p className="text-sm text-[var(--color-outline)]">{record.date} • {record.type}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline)]">download</span>
            </div>
          ))}
        </div>
      </main>

      <BottomNavBar />
    </>
  );
}
