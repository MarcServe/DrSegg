"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNavBar from "@/components/BottomNavBar";
import { createClient } from "@/lib/supabase/client";

type ProfileRow = {
  display_name: string | null;
  region: string | null;
  farm_type: string | null;
};

export default function Profile() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("display_name, region, farm_type")
          .eq("id", user.id)
          .maybeSingle();
        setProfile(data as ProfileRow | null);
      }
    })();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const displayName =
    profile?.display_name || email?.split("@")[0] || "Farmer";
  const region = profile?.region || "Northern Highlands District";
  const farmType = profile?.farm_type || "Mixed (Cattle & Poultry)";

  return (
    <>
      <header className="bg-[#f9faf6] dark:bg-stone-950 flex justify-between items-center px-6 py-4 w-full fixed top-0 z-50">
        <Link href="/" className="flex items-center gap-4 cursor-pointer hover:opacity-80">
          <span className="text-[#0f5238] dark:text-emerald-400 font-manrope font-extrabold text-xl tracking-tight">
            Farm Profile
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Edit profile"
            className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 cursor-pointer hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors rounded-full p-2 active:scale-95 duration-150"
          >
            edit
          </button>
        </div>
      </header>

      <main className="mt-20 px-6 pb-32 max-w-lg mx-auto w-full space-y-8">
        <Link href="/records" className="flex flex-col items-center mt-8 cursor-pointer active:scale-[0.99] transition-transform">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--color-primary-container)] shadow-lg relative bg-[var(--color-surface-container-high)]">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdBrVzwvF4MuAo8DcC2SKHia_tD4GDSTywNHwnqAyfDR4g3QPrEPUOcJ-H6dr6zZHBmFToyG9ncuKf80z2JJSyLeutYRlRoAoTCdBQByF_iDV5Cm6mybyxMCLYqa7PHRCohE6AYjq1oCcj7rerX85D6RCgBfl0qYc4p9_GrmixVs1jPCy3mJX_zZSYvEbNkQxG6z9VYxgFCyQFe0Ps66KN65UKONyEtvXf2sUCtOUs8XiddnvjLfFY2O7A-mUMIBLSPz7EyW_SFC4"
              alt="Farmer Profile"
              fill
              className="object-cover"
            />
          </div>
          <h2 className="text-3xl font-headline font-extrabold text-[var(--color-primary)] mt-4">{displayName}</h2>
          <p className="text-[var(--color-on-surface-variant)] font-medium text-center">{email || "—"}</p>
        </Link>

        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl shadow-sm border border-[var(--color-outline-variant)]/15 space-y-6">
          <button type="button" className="w-full flex items-center justify-between border-b border-[var(--color-surface-container-high)] pb-4 cursor-pointer hover:opacity-90 text-left active:scale-[0.99]">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[var(--color-primary)]">location_on</span>
              <div>
                <p className="text-sm text-[var(--color-outline)] font-bold uppercase tracking-wider">Region</p>
                <p className="font-bold text-[var(--color-on-surface)]">{region}</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[var(--color-outline)]">chevron_right</span>
          </button>

          <button type="button" className="w-full flex items-center justify-between border-b border-[var(--color-surface-container-high)] pb-4 cursor-pointer hover:opacity-90 text-left active:scale-[0.99]">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[var(--color-primary)]">agriculture</span>
              <div>
                <p className="text-sm text-[var(--color-outline)] font-bold uppercase tracking-wider">Farm Type</p>
                <p className="font-bold text-[var(--color-on-surface)]">{farmType}</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[var(--color-outline)]">chevron_right</span>
          </button>

          <button type="button" className="w-full flex items-center justify-between cursor-pointer hover:opacity-90 text-left active:scale-[0.99]">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[var(--color-primary)]">language</span>
              <div>
                <p className="text-sm text-[var(--color-outline)] font-bold uppercase tracking-wider">Language</p>
                <p className="font-bold text-[var(--color-on-surface)]">English (UK)</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[var(--color-outline)]">chevron_right</span>
          </button>
        </div>

        <div className="space-y-4">
          <Link href="/records" className="w-full bg-[var(--color-surface-container-low)] p-4 rounded-xl flex items-center gap-4 hover:bg-[var(--color-surface-container-high)] transition-colors text-[var(--color-on-surface-variant)] font-bold cursor-pointer active:scale-[0.99]">
            <span className="material-symbols-outlined">help_center</span>
            Support & Help
          </Link>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="w-full bg-[var(--color-error-container)]/20 p-4 rounded-xl flex items-center gap-4 hover:bg-[var(--color-error-container)]/30 transition-colors text-[var(--color-error)] font-bold cursor-pointer active:scale-[0.99]"
          >
            <span className="material-symbols-outlined">logout</span>
            Sign Out
          </button>
        </div>
      </main>

      <BottomNavBar />
    </>
  );
}
