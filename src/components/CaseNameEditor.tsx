"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  caseId: string;
  initialName: string | null | undefined;
  animalType: string;
  /** Smaller layout for records / inline toolbars */
  variant?: "default" | "compact";
  /** Called after a successful save (e.g. refresh client-fetched lists) */
  onSaved?: () => void;
};

export function CaseNameEditor({
  caseId,
  initialName,
  animalType,
  variant = "default",
  onSaved,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName?.trim() ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const compact = variant === "compact";

  useEffect(() => {
    if (!editing) {
      setName(initialName?.trim() ?? "");
    }
  }, [initialName, editing]);

  const display = name.trim() || animalType;

  const save = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("Please sign in to save the case title.");
        return;
      }

      const trimmed = name.trim().slice(0, 120);
      const payload = { display_name: trimmed.length ? trimmed : null };

      const { data, error } = await supabase
        .from("cases")
        .update(payload)
        .eq("id", caseId)
        .eq("user_id", user.id)
        .select("id, display_name")
        .maybeSingle();

      if (error) {
        const msg = error.message ?? "";
        if (msg.toLowerCase().includes("display_name")) {
          alert(
            "Case titles need a database update. Apply the migration that adds the display_name column on cases (see supabase/migrations), or ask your admin."
          );
        } else {
          alert(msg || "Could not save case title.");
        }
        return;
      }

      if (!data) {
        alert("Case not found or you do not have access.");
        return;
      }

      setName((data.display_name ?? "").trim());
      setEditing(false);
      router.refresh();
      onSaved?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not save case title.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = compact
    ? "w-full text-base font-bold font-manrope border border-[var(--color-outline-variant)] rounded-xl px-3 py-2 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]"
    : "w-full text-2xl font-extrabold font-manrope border border-[var(--color-outline-variant)] rounded-xl px-3 py-2 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]";

  const titleClass = compact
    ? "text-lg font-extrabold font-manrope text-[var(--color-primary)] tracking-tight capitalize flex-1 min-w-0 break-words"
    : "text-3xl font-extrabold font-manrope text-[var(--color-primary)] tracking-tight capitalize flex-1 min-w-0 break-words";

  if (editing) {
    return (
      <div className={`flex flex-col gap-2 w-full ${compact ? "mt-0" : "mt-1"}`}>
        <label className="sr-only" htmlFor={`case-name-${caseId}`}>
          Case name
        </label>
        <input
          id={`case-name-${caseId}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`e.g. North coop, ${animalType}`}
          className={inputClass}
          maxLength={120}
          autoFocus
        />
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="px-4 py-2 rounded-full bg-[var(--color-primary)] text-white text-sm font-bold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setName(initialName?.trim() ?? "");
            }}
            className="px-4 py-2 rounded-full border border-[var(--color-outline-variant)] text-sm font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start justify-between gap-3 w-full ${compact ? "mt-0" : "mt-1"}`}>
      <h2 className={titleClass}>{display}</h2>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="shrink-0 material-symbols-outlined text-[var(--color-primary)] p-2 rounded-full hover:bg-[var(--color-surface-container-high)]"
        aria-label="Edit case name"
      >
        edit
      </button>
    </div>
  );
}
