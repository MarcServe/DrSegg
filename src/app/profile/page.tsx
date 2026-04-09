"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNavBar from "@/components/BottomNavBar";
import { createClient } from "@/lib/supabase/client";

type ProfileRow = {
  display_name: string | null;
  region: string | null;
  farm_type: string | null;
  avatar_url: string | null;
  phone: string | null;
  country: string | null;
  farm_name: string | null;
  preferred_language: string | null;
  role: string | null;
  bio: string | null;
};

type FormState = {
  display_name: string;
  phone: string;
  country: string;
  region: string;
  farm_name: string;
  farm_type: string;
  preferred_language: string;
  role: string;
  bio: string;
};

const EMPTY_FORM: FormState = {
  display_name: "",
  phone: "",
  country: "",
  region: "",
  farm_name: "",
  farm_type: "",
  preferred_language: "en",
  role: "farmer",
  bio: "",
};

const FARM_TYPES = [
  { value: "", label: "Select…" },
  { value: "poultry", label: "Poultry" },
  { value: "cattle", label: "Cattle" },
  { value: "goat_sheep", label: "Goat / sheep" },
  { value: "pig", label: "Pig" },
  { value: "mixed", label: "Mixed livestock" },
  { value: "crop", label: "Crop-focused" },
  { value: "aquaculture", label: "Aquaculture" },
  { value: "other", label: "Other" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "pcm", label: "Nigerian Pidgin" },
  { value: "ha", label: "Hausa" },
  { value: "ig", label: "Igbo" },
  { value: "yo", label: "Yoruba" },
  { value: "fr", label: "French" },
];

const ROLES = [
  { value: "farmer", label: "Farmer / producer" },
  { value: "staff", label: "Farm staff" },
  { value: "vet", label: "Veterinarian" },
  { value: "admin", label: "Administrator" },
];

const MAX_BYTES = 2 * 1024 * 1024;

function rowToForm(row: ProfileRow | null): FormState {
  if (!row) return { ...EMPTY_FORM };
  return {
    display_name: row.display_name ?? "",
    phone: row.phone ?? "",
    country: row.country ?? "",
    region: row.region ?? "",
    farm_name: row.farm_name ?? "",
    farm_type: row.farm_type ?? "",
    preferred_language: row.preferred_language || "en",
    role: row.role || "farmer",
    bio: row.bio ?? "",
  };
}

export default function Profile() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  const loadProfile = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setEmail(user?.email ?? null);
    setUserId(user?.id ?? null);
    if (!user) {
      setProfile(null);
      setForm(EMPTY_FORM);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select(
        "display_name, region, farm_type, avatar_url, phone, country, farm_name, preferred_language, role, bio"
      )
      .eq("id", user.id)
      .maybeSingle();
    const row = data as ProfileRow | null;
    setProfile(row);
    setForm(rowToForm(row));
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaveError(null);
    setSaveOk(false);
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        id: userId,
        display_name: form.display_name.trim() || null,
        phone: form.phone.trim() || null,
        country: form.country.trim() || null,
        region: form.region.trim() || null,
        farm_name: form.farm_name.trim() || null,
        farm_type: form.farm_type.trim() || null,
        preferred_language: form.preferred_language || "en",
        role: form.role || "farmer",
        bio: form.bio.trim() || null,
      };
      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
      if (error) throw error;
      setSaveOk(true);
      setProfile((prev) =>
        prev
          ? { ...prev, ...payload }
          : ({
              ...payload,
              avatar_url: null,
            } as ProfileRow)
      );
      router.refresh();
      setTimeout(() => setSaveOk(false), 3000);
    } catch (err) {
      console.error(err);
      setSaveError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;

    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError("Image must be 2MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase();
      const safeExt = ext && /^[a-z0-9]+$/.test(ext) && ext.length <= 8 ? ext : "jpg";
      const path = `${userId}/avatar.${safeExt}`;

      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type || "image/jpeg",
      });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: dbErr } = await supabase.from("profiles").upsert(
        { id: userId, avatar_url: publicUrl },
        { onConflict: "id" }
      );
      if (dbErr) throw dbErr;

      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev));
      router.refresh();
    } catch (err) {
      console.error(err);
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const displayName =
    form.display_name.trim() || profile?.display_name || email?.split("@")[0] || "Farmer";
  const avatarUrl = profile?.avatar_url;

  const inputClass =
    "w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 py-3 text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]";

  const labelClass = "block text-xs font-bold uppercase tracking-wider text-[var(--color-outline)] mb-1.5";

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
            aria-label="Change profile photo"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || !userId}
            className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 cursor-pointer hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors rounded-full p-2 active:scale-95 duration-150 disabled:opacity-50"
          >
            photo_camera
          </button>
        </div>
      </header>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => void handleAvatarFile(e)}
      />

      <main className="mt-20 px-6 pb-32 max-w-lg mx-auto w-full space-y-8">
        <div className="flex flex-col items-center mt-6">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || !userId}
            className="relative flex flex-col items-center cursor-pointer disabled:cursor-not-allowed active:scale-[0.99] transition-transform group"
          >
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[var(--color-primary-container)] shadow-lg relative bg-[var(--color-surface-container-high)]">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile photo"
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] font-headline text-3xl font-extrabold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm font-bold">
                  …
                </div>
              )}
            </div>
            <span className="mt-2 text-xs font-bold text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? "Uploading…" : "Change photo"}
            </span>
          </button>

          <p className="text-sm text-[var(--color-on-surface-variant)] font-medium text-center mt-3">
            {email || "—"}
          </p>
          {uploadError && (
            <p className="text-sm text-red-600 mt-2 text-center max-w-sm" role="alert">
              {uploadError}
            </p>
          )}
          {!userId && (
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-2">
              <Link href="/login" className="font-bold text-[var(--color-primary)] underline">
                Sign in
              </Link>{" "}
              to edit your profile.
            </p>
          )}
        </div>

        {userId && (
          <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
            <section className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl shadow-sm border border-[var(--color-outline-variant)]/15 space-y-4">
              <h3 className="font-headline font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">badge</span>
                Your name
              </h3>
              <div>
                <label className={labelClass} htmlFor="display_name">
                  Display name
                </label>
                <input
                  id="display_name"
                  name="display_name"
                  autoComplete="name"
                  className={inputClass}
                  value={form.display_name}
                  onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                  placeholder="e.g. Amaka Okafor"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+234 …"
                />
              </div>
            </section>

            <section className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl shadow-sm border border-[var(--color-outline-variant)]/15 space-y-4">
              <h3 className="font-headline font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">location_on</span>
                Location
              </h3>
              <div>
                <label className={labelClass} htmlFor="country">
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  autoComplete="country-name"
                  className={inputClass}
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  placeholder="e.g. Nigeria"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="region">
                  State / region
                </label>
                <input
                  id="region"
                  name="region"
                  className={inputClass}
                  value={form.region}
                  onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                  placeholder="e.g. Kaduna State"
                />
              </div>
            </section>

            <section className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl shadow-sm border border-[var(--color-outline-variant)]/15 space-y-4">
              <h3 className="font-headline font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">agriculture</span>
                Farm
              </h3>
              <div>
                <label className={labelClass} htmlFor="farm_name">
                  Farm or business name
                </label>
                <input
                  id="farm_name"
                  name="farm_name"
                  className={inputClass}
                  value={form.farm_name}
                  onChange={(e) => setForm((f) => ({ ...f, farm_name: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="farm_type">
                  Primary enterprise
                </label>
                <select
                  id="farm_type"
                  name="farm_type"
                  className={inputClass}
                  value={form.farm_type}
                  onChange={(e) => setForm((f) => ({ ...f, farm_type: e.target.value }))}
                >
                  {[
                    ...FARM_TYPES,
                    ...(form.farm_type && !FARM_TYPES.some((f) => f.value === form.farm_type)
                      ? [{ value: form.farm_type, label: form.farm_type }]
                      : []),
                  ].map((o) => (
                    <option key={o.value || "empty"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl shadow-sm border border-[var(--color-outline-variant)]/15 space-y-4">
              <h3 className="font-headline font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">tune</span>
                Preferences
              </h3>
              <div>
                <label className={labelClass} htmlFor="preferred_language">
                  Language
                </label>
                <select
                  id="preferred_language"
                  name="preferred_language"
                  className={inputClass}
                  value={form.preferred_language}
                  onChange={(e) => setForm((f) => ({ ...f, preferred_language: e.target.value }))}
                >
                  {LANGUAGES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="role">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  className={inputClass}
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  {ROLES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl shadow-sm border border-[var(--color-outline-variant)]/15 space-y-4">
              <h3 className="font-headline font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">notes</span>
                About
              </h3>
              <div>
                <label className={labelClass} htmlFor="bio">
                  Short bio (optional)
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  className={`${inputClass} resize-y min-h-[100px]`}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Herd size, main species, or anything helpful for context."
                />
              </div>
            </section>

            {saveError && (
              <p className="text-sm text-red-600 px-1" role="alert">
                {saveError}
              </p>
            )}
            {saveOk && (
              <p className="text-sm text-[var(--color-primary)] font-bold px-1">Profile saved.</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-xl bg-[var(--color-primary)] text-white font-headline font-bold text-lg shadow-lg hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </form>
        )}

        <div className="space-y-4">
          <Link
            href="/records"
            className="w-full bg-[var(--color-surface-container-low)] p-4 rounded-xl flex items-center gap-4 hover:bg-[var(--color-surface-container-high)] transition-colors text-[var(--color-on-surface-variant)] font-bold cursor-pointer active:scale-[0.99]"
          >
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
