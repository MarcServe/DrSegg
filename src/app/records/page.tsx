"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BottomNavBar from "@/components/BottomNavBar";
import { CaseNameEditor } from "@/components/CaseNameEditor";
import { createClient } from "@/lib/supabase/client";
import { isMissingDisplayNameColumn } from "@/lib/case-detail-select";

type CaseOption = {
  id: string;
  animal_type: string;
  created_at: string;
  display_name: string | null;
};

type DocRow = {
  id: string;
  title: string;
  file_url: string;
  doc_type: string | null;
  created_at: string;
  case_id: string | null;
  cases: { animal_type: string; display_name?: string | null } | null;
};

function normalizeCasesEmbed(
  cases: unknown
): { animal_type: string; display_name?: string | null } | null {
  if (!cases || typeof cases !== "object") return null;
  if (Array.isArray(cases)) {
    const first = cases[0];
    return first && typeof first === "object" && "animal_type" in first
      ? (first as { animal_type: string; display_name?: string | null })
      : null;
  }
  if ("animal_type" in cases) return cases as { animal_type: string; display_name?: string | null };
  return null;
}

function caseOptionLabel(c: CaseOption): string {
  const title = c.display_name?.trim() || c.animal_type;
  return `${title} · ${new Date(c.created_at).toLocaleDateString()} · #${c.id.slice(0, 8)}`;
}

function linkedCaseLabel(cases: DocRow["cases"], animalFallback: string): string {
  const dn = cases?.display_name?.trim();
  if (dn) return dn;
  return `${animalFallback} case`;
}

function RecordsContent() {
  const searchParams = useSearchParams();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [optionalCaseId, setOptionalCaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    let { data, error } = await supabase
      .from("farm_documents")
      .select("id, title, file_url, doc_type, created_at, case_id, cases(animal_type, display_name)")
      .order("created_at", { ascending: false });
    if (error && isMissingDisplayNameColumn(error)) {
      const r2 = await supabase
        .from("farm_documents")
        .select("id, title, file_url, doc_type, created_at, case_id, cases(animal_type)")
        .order("created_at", { ascending: false });
      data = r2.data as typeof data;
      error = r2.error;
      if (!error && data) {
        setDocs(
          (data as Record<string, unknown>[]).map((row) => {
            const emb = normalizeCasesEmbed(row.cases);
            return {
              id: row.id as string,
              title: row.title as string,
              file_url: row.file_url as string,
              doc_type: (row.doc_type as string | null) ?? null,
              created_at: row.created_at as string,
              case_id: (row.case_id as string | null) ?? null,
              cases: emb ? { animal_type: emb.animal_type, display_name: null } : null,
            };
          })
        );
        setLoading(false);
        return;
      }
    }
    if (!error && data) {
      setDocs(
        (data as Record<string, unknown>[]).map((row) => ({
          id: row.id as string,
          title: row.title as string,
          file_url: row.file_url as string,
          doc_type: (row.doc_type as string | null) ?? null,
          created_at: row.created_at as string,
          case_id: (row.case_id as string | null) ?? null,
          cases: normalizeCasesEmbed(row.cases),
        }))
      );
    }
    setLoading(false);
  }, []);

  const loadCases = useCallback(async () => {
    const supabase = createClient();
    let { data, error } = await supabase
      .from("cases")
      .select("id, animal_type, created_at, display_name")
      .order("created_at", { ascending: false })
      .limit(80);
    if (error && isMissingDisplayNameColumn(error)) {
      const r2 = await supabase
        .from("cases")
        .select("id, animal_type, created_at")
        .order("created_at", { ascending: false })
        .limit(80);
      data = r2.data?.map((c) => ({ ...c, display_name: null as string | null })) ?? null;
      error = r2.error;
    }
    if (!error && data) setCases(data as CaseOption[]);
  }, []);

  useEffect(() => {
    void load();
    void loadCases();
  }, [load, loadCases]);

  useEffect(() => {
    const raw = searchParams.get("case");
    if (raw && /^[0-9a-f-]{36}$/i.test(raw)) {
      setOptionalCaseId(raw);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!cases.length || !optionalCaseId) return;
    if (!cases.some((c) => c.id === optionalCaseId)) {
      setOptionalCaseId(null);
    }
  }, [cases, optionalCaseId]);

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
      const insert: Record<string, unknown> = {
        user_id: user.id,
        title: file.name,
        file_url: path,
        doc_type: file.type || "file",
      };
      if (optionalCaseId) {
        insert.case_id = optionalCaseId;
      }
      await supabase.from("farm_documents").insert(insert);
    }
    e.target.value = "";
    void load();
  }

  async function openDownload(record: DocRow) {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from("case-media").createSignedUrl(record.file_url, 3600);
    if (error || !data?.signedUrl) {
      console.error(error);
      alert("Could not open file. Check storage permissions.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  const q = searchQuery.trim().toLowerCase();
  const filteredDocs =
    q.length === 0
      ? docs
      : docs.filter(
          (d) =>
            d.title.toLowerCase().includes(q) ||
            (d.doc_type?.toLowerCase().includes(q) ?? false) ||
            (d.cases?.animal_type?.toLowerCase().includes(q) ?? false) ||
            (d.cases?.display_name?.toLowerCase().includes(q) ?? false)
        );

  const selectedCase = optionalCaseId ? cases.find((c) => c.id === optionalCaseId) : undefined;

  return (
    <>
      <header className="bg-[#f9faf6] dark:bg-stone-950 flex justify-between items-center px-6 py-4 w-full fixed top-0 z-50">
        <Link href="/" className="flex items-center gap-4 cursor-pointer hover:opacity-80">
          <span className="text-[#0f5238] dark:text-emerald-400 font-manrope font-extrabold text-xl tracking-tight">
            Medical Records
          </span>
        </Link>
        <div className="flex items-center gap-2 min-w-0 flex-1 max-w-[220px] mx-2">
          <label className="sr-only" htmlFor="records-search">
            Search records
          </label>
          <span className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 shrink-0 text-xl">
            search
          </span>
          <input
            id="records-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter…"
            className="w-full rounded-full border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-3 py-1.5 text-sm text-[var(--color-on-surface)]"
          />
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

        <label className="block space-y-2">
          <span className="text-sm font-bold text-[var(--color-on-surface-variant)]">
            Attach to case (optional)
          </span>
          <select
            value={optionalCaseId ?? ""}
            onChange={(e) => setOptionalCaseId(e.target.value || null)}
            className="w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 py-3 text-[var(--color-on-surface)]"
          >
            <option value="">No case — general farm record</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {caseOptionLabel(c)}
              </option>
            ))}
          </select>
          {selectedCase ? (
            <div className="rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-low)] p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-outline)]">
                Case title
              </span>
              <CaseNameEditor
                key={selectedCase.id}
                caseId={selectedCase.id}
                initialName={selectedCase.display_name}
                animalType={selectedCase.animal_type}
                variant="compact"
                onSaved={() => {
                  void loadCases();
                  void load();
                }}
              />
            </div>
          ) : null}
          <p className="text-xs text-[var(--color-outline)]">
            New uploads are linked to the selected case. Change anytime before uploading.
          </p>
        </label>

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
          {!loading && docs.length > 0 && filteredDocs.length === 0 && (
            <p className="text-sm text-[var(--color-on-surface-variant)]">No matches for that filter.</p>
          )}
          {filteredDocs.map((record) => (
            <button
              key={record.id}
              type="button"
              onClick={() => void openDownload(record)}
              className="w-full bg-[var(--color-surface-container-lowest)] p-4 rounded-xl flex items-center justify-between shadow-sm border border-[var(--color-outline-variant)]/15 text-left hover:bg-[var(--color-surface-container-low)] transition-colors active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 shrink-0 bg-[var(--color-surface-container-highest)] rounded-full flex items-center justify-center text-[var(--color-primary)]">
                  <span className="material-symbols-outlined">
                    {record.doc_type?.includes("pdf")
                      ? "picture_as_pdf"
                      : record.doc_type?.startsWith("image")
                        ? "image"
                        : "description"}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[var(--color-on-surface)] truncate">{record.title}</p>
                  <p className="text-sm text-[var(--color-outline)]">
                    {new Date(record.created_at).toLocaleDateString()} • {record.doc_type || "File"}
                  </p>
                  {record.case_id && record.cases?.animal_type ? (
                    <p className="text-xs text-[var(--color-primary)] font-semibold mt-1">
                      Linked:{" "}
                      <Link
                        href={`/case/${record.case_id}`}
                        className="underline underline-offset-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {linkedCaseLabel(record.cases, record.cases.animal_type)}
                      </Link>
                    </p>
                  ) : null}
                </div>
              </div>
              <span className="material-symbols-outlined text-[var(--color-primary)] shrink-0" aria-hidden>
                download
              </span>
            </button>
          ))}
        </div>
      </main>

      <BottomNavBar />
    </>
  );
}

export default function Records() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-28 text-center text-[var(--color-on-surface-variant)]">
          Loading…
        </div>
      }
    >
      <RecordsContent />
    </Suspense>
  );
}
