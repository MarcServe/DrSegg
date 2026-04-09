"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import BottomNavBar from "@/components/BottomNavBar";
import { createClient } from "@/lib/supabase/client";

type DocRow = {
  id: string;
  title: string;
  file_url: string;
  doc_type: string | null;
  created_at: string;
};

export default function Records() {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("farm_documents")
      .select("id, title, file_url, doc_type, created_at")
      .order("created_at", { ascending: false });
    if (!error && data) setDocs(data as DocRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login?next=/records";
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/docs/${crypto.randomUUID()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from("case-media").upload(path, file, {
        contentType: file.type || "application/octet-stream",
      });
      if (upErr) {
        console.error(upErr);
        continue;
      }
      await supabase.from("farm_documents").insert({
        user_id: user.id,
        title: file.name,
        file_url: path,
        doc_type: file.type || "file",
      });
    }
    e.target.value = "";
    void load();
  }

  return (
    <>
      <header className="bg-[#f9faf6] dark:bg-stone-950 flex justify-between items-center px-6 py-4 w-full fixed top-0 z-50">
        <Link href="/" className="flex items-center gap-4 cursor-pointer hover:opacity-80">
          <span className="text-[#0f5238] dark:text-emerald-400 font-manrope font-extrabold text-xl tracking-tight">
            Medical Records
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Search records"
            className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 cursor-pointer hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors rounded-full p-2 active:scale-95 duration-150"
          >
            search
          </button>
        </div>
      </header>

      <main className="mt-20 px-6 pb-32 max-w-lg mx-auto w-full space-y-6">
        <input
          type="file"
          className="hidden"
          id="farm-doc-upload"
          multiple
          onChange={handleUpload}
        />
        <button
          type="button"
          onClick={() => document.getElementById("farm-doc-upload")?.click()}
          className="w-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] p-6 rounded-xl flex items-center justify-between shadow-md cursor-pointer hover:opacity-95 active:scale-[0.99] text-left"
        >
          <div>
            <h2 className="font-headline font-bold text-xl">Upload New Record</h2>
            <p className="text-sm opacity-80 mt-1">Keep all farm documents in one place</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
            <span className="material-symbols-outlined text-2xl">upload_file</span>
          </div>
        </button>

        <div className="space-y-4 mt-8">
          <Link
            href="/cases"
            className="block font-headline font-bold text-[var(--color-on-surface-variant)] text-lg cursor-pointer hover:text-[var(--color-primary)] w-fit"
          >
            Recent Documents
          </Link>
          {loading && <p className="text-sm text-[var(--color-outline)]">Loading…</p>}
          {!loading && docs.length === 0 && (
            <p className="text-sm text-[var(--color-on-surface-variant)]">
              No documents yet. Upload PDFs, images, or receipts above.
            </p>
          )}
          {docs.map((record) => (
            <button
              key={record.id}
              type="button"
              className="w-full bg-[var(--color-surface-container-lowest)] p-4 rounded-xl flex items-center justify-between hover:bg-[var(--color-surface-container-low)] transition-colors shadow-sm border border-[var(--color-outline-variant)]/15 cursor-pointer text-left active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--color-surface-container-highest)] rounded-full flex items-center justify-center text-[var(--color-primary)]">
                  <span className="material-symbols-outlined">
                    {record.doc_type?.includes("pdf")
                      ? "picture_as_pdf"
                      : record.doc_type?.startsWith("image")
                        ? "image"
                        : "description"}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-[var(--color-on-surface)]">{record.title}</p>
                  <p className="text-sm text-[var(--color-outline)]">
                    {new Date(record.created_at).toLocaleDateString()} • {record.doc_type || "File"}
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline)]">download</span>
            </button>
          ))}
        </div>
      </main>

      <BottomNavBar />
    </>
  );
}
