"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  caseId: string;
  initialMonitoringActive: boolean;
};

export function CaseMonitoringBar({ caseId, initialMonitoringActive }: Props) {
  const router = useRouter();
  const [active, setActive] = useState(initialMonitoringActive);
  const [busy, setBusy] = useState(false);

  const setMonitoring = async (next: boolean) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monitoring_active: next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Update failed");
      setActive(next);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-low)]/80 p-4 space-y-2">
      <p className="text-sm font-bold text-[var(--color-on-surface)]">Monitoring on home &amp; lists</p>
      {active ? (
        <>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            This case appears under <span className="font-semibold text-[var(--color-on-surface)]">Actively monitoring</span> on the
            cases screen.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void setMonitoring(false)}
            className="text-sm font-bold text-[var(--color-on-surface-variant)] underline hover:text-[var(--color-primary)] disabled:opacity-50"
          >
            Move to older / not actively monitoring
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            Listed under <span className="font-semibold">Older / not actively monitoring</span> — you can still open it anytime.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void setMonitoring(true)}
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-sm font-bold px-4 py-2 disabled:opacity-50"
          >
            Show in active monitoring again
          </button>
        </>
      )}
    </div>
  );
}
