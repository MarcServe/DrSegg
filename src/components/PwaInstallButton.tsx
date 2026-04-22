"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "dr-morgees-pwa-install-dismissed-at";
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000;

type BeforeInstallPromptEventLike = Event & {
  preventDefault: () => void;
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
  return false;
}

function isAppleMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;
  return false;
}

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const t = parseInt(raw, 10);
    if (Number.isNaN(t)) return false;
    return Date.now() - t < DISMISS_MS;
  } catch {
    return false;
  }
}

export function PwaInstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEventLike | null>(null);
  const [showFab, setShowFab] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasDismissedRecently()) return;

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* ignore — install still may work in some environments */
      });
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEventLike);
      setShowFab(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    if (isAppleMobile()) {
      const id = window.setTimeout(() => setShowFab(true), 1500);
      return () => {
        clearTimeout(id);
        window.removeEventListener("beforeinstallprompt", onBip);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setShowFab(false);
    setIosHelp(false);
  }, []);

  const onPlusClick = useCallback(async () => {
    if (deferred) {
      try {
        await deferred.prompt();
        await deferred.userChoice;
      } catch {
        /* user dismissed or prompt failed */
      }
      setDeferred(null);
      setShowFab(false);
      return;
    }
    if (isAppleMobile()) {
      setIosHelp(true);
      return;
    }
  }, [deferred]);

  if (!showFab) return null;

  return (
    <>
      <div className="fixed bottom-28 right-3 z-[60] flex flex-col items-end gap-2 pointer-events-auto pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={dismiss}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-container-highest)] text-[var(--color-outline)] shadow-md text-sm font-bold hover:bg-[var(--color-surface-container-high)]"
          aria-label="Hide install button"
        >
          ×
        </button>
        <button
          type="button"
          onClick={() => void onPlusClick()}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30 text-3xl font-light leading-none hover:opacity-95 active:scale-95"
          aria-label="Add Dr Morgees to home screen"
          title="Add to home screen"
        >
          +
        </button>
        <span className="max-w-[10rem] text-right text-[10px] font-bold uppercase tracking-wide text-[var(--color-on-surface-variant)]">
          Add app
        </span>
      </div>

      {iosHelp ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 pb-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-ios-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIosHelp(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-xl border border-[var(--color-outline-variant)]/20">
            <h2 id="pwa-ios-title" className="font-headline text-lg font-bold text-[var(--color-on-surface)]">
              Add to Home Screen
            </h2>
            <ol className="mt-3 list-decimal pl-5 space-y-2 text-sm text-[var(--color-on-surface-variant)]">
              <li>
                Tap the <span className="font-bold text-[var(--color-on-surface)]">Share</span> button in the Safari
                toolbar (square with arrow — often bottom centre on iPhone).
              </li>
              <li>
                Scroll and tap <span className="font-bold text-[var(--color-on-surface)]">Add to Home Screen</span>.
              </li>
              <li>Confirm — you will get a Dr Morgees icon on your home screen like any app.</li>
            </ol>
            <p className="mt-3 text-xs text-[var(--color-outline)]">
              Chrome and Edge on Android: use the <span className="font-semibold">+</span> button when your browser
              offers &quot;Install app&quot; or use the menu → &quot;Install app&quot; / &quot;Add to Home
              screen&quot;.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={dismiss}
                className="rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
