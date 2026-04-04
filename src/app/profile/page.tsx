import Image from "next/image";
import BottomNavBar from "@/components/BottomNavBar";

export default function Profile() {
  return (
    <>
      <header className="bg-[#f9faf6] dark:bg-stone-950 flex justify-between items-center px-6 py-4 w-full fixed top-0 z-50">
        <div className="flex items-center gap-4">
          <span className="text-[#0f5238] dark:text-emerald-400 font-manrope font-extrabold text-xl tracking-tight">
            Farm Profile
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 cursor-pointer hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors rounded-full p-2 active:scale-95 duration-150">
            edit
          </span>
        </div>
      </header>

      <main className="mt-20 px-6 pb-32 max-w-lg mx-auto w-full space-y-8">
        <div className="flex flex-col items-center mt-8">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--color-primary-container)] shadow-lg relative">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdBrVzwvF4MuAo8DcC2SKHia_tD4GDSTywNHwnqAyfDR4g3QPrEPUOcJ-H6dr6zZHBmFToyG9ncuKf80z2JJSyLeutYRlRoAoTCdBQByF_iDV5Cm6mybyxMCLYqa7PHRCohE6AYjq1oCcj7rerX85D6RCgBfl0qYc4p9_GrmixVs1jPCy3mJX_zZSYvEbNkQxG6z9VYxgFCyQFe0Ps66KN65UKONyEtvXf2sUCtOUs8XiddnvjLfFY2O7A-mUMIBLSPz7EyW_SFC4"
              alt="Farmer Profile"
              fill
              className="object-cover"
            />
          </div>
          <h2 className="text-3xl font-headline font-extrabold text-[var(--color-primary)] mt-4">John Doe</h2>
          <p className="text-[var(--color-on-surface-variant)] font-medium">Green Valley Farms</p>
        </div>

        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl shadow-sm border border-[var(--color-outline-variant)]/15 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-surface-container-high)] pb-4">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[var(--color-primary)]">location_on</span>
              <div>
                <p className="text-sm text-[var(--color-outline)] font-bold uppercase tracking-wider">Region</p>
                <p className="font-bold text-[var(--color-on-surface)]">Northern Highlands District</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[var(--color-outline)]">chevron_right</span>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--color-surface-container-high)] pb-4">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[var(--color-primary)]">agriculture</span>
              <div>
                <p className="text-sm text-[var(--color-outline)] font-bold uppercase tracking-wider">Farm Type</p>
                <p className="font-bold text-[var(--color-on-surface)]">Mixed (Cattle & Poultry)</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[var(--color-outline)]">chevron_right</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[var(--color-primary)]">language</span>
              <div>
                <p className="text-sm text-[var(--color-outline)] font-bold uppercase tracking-wider">Language</p>
                <p className="font-bold text-[var(--color-on-surface)]">English (UK)</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[var(--color-outline)]">chevron_right</span>
          </div>
        </div>

        <div className="space-y-4">
          <button className="w-full bg-[var(--color-surface-container-low)] p-4 rounded-xl flex items-center gap-4 hover:bg-[var(--color-surface-container-high)] transition-colors text-[var(--color-on-surface-variant)] font-bold">
            <span className="material-symbols-outlined">help_center</span>
            Support & Help
          </button>
          <button className="w-full bg-[var(--color-error-container)]/20 p-4 rounded-xl flex items-center gap-4 hover:bg-[var(--color-error-container)]/30 transition-colors text-[var(--color-error)] font-bold">
            <span className="material-symbols-outlined">logout</span>
            Sign Out
          </button>
        </div>
      </main>

      <BottomNavBar />
    </>
  );
}
