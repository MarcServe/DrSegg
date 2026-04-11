import Link from "next/link";
import { notFound } from "next/navigation";
import BottomNavBar from "@/components/BottomNavBar";
import { AnimalIcon, animalTypeToIconKey } from "@/components/AnimalIcon";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ id: string }> };

export default async function CaseDetail({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("cases")
    .select(
      `
      id,
      animal_type,
      health_status,
      status,
      created_at,
      case_analysis ( possible_conditions, severity ),
      ai_assessments ( summary, confidence_score, recommendation_type, needs_more_info ),
      followups ( created_at, notes, status )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !row) {
    notFound();
  }

  const { data: attachedDocs } = await supabase
    .from("farm_documents")
    .select("id, title, doc_type, created_at")
    .eq("case_id", id)
    .order("created_at", { ascending: false });

  const analysis = Array.isArray(row.case_analysis)
    ? row.case_analysis[0]
    : row.case_analysis;
  const aiRows = row.ai_assessments as
    | { summary: string | null; confidence_score: number | null; recommendation_type: string | null; needs_more_info: boolean | null }[]
    | { summary: string | null; confidence_score: number | null; recommendation_type: string | null; needs_more_info: boolean | null }
    | null;
  const aiAssessment = Array.isArray(aiRows) ? aiRows[0] : aiRows;
  const followups = (Array.isArray(row.followups) ? row.followups : []) as {
    created_at: string;
    notes: string | null;
    status: string | null;
  }[];

  const sortedFollowups = [...followups].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const timeline = sortedFollowups.slice(0, 5).map((f, idx) => ({
    day:
      idx === 0
        ? "Latest"
        : new Date(f.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
    desc: f.notes || "Follow-up recorded",
    status:
      f.status === "improving"
        ? "Improving"
        : f.status === "worsening"
          ? "Worsening"
          : "Unchanged",
  }));

  if (timeline.length === 0) {
    timeline.push({
      day: "Start",
      desc: `Case opened — ${row.animal_type}`,
      status: "Unchanged",
    });
  }

  const badgeClass = (status: string) => {
    if (status === "Improving")
      return "bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed)]";
    if (status === "Worsening")
      return "bg-[var(--color-tertiary-fixed)] text-[var(--color-on-tertiary-fixed-variant)]";
    return "bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]";
  };

  const subtitle =
    aiAssessment?.summary?.slice(0, 120) ||
    (analysis?.possible_conditions as string[] | undefined)?.[0] ||
    row.health_status?.replace(/_/g, " ") ||
    "Case review";

  const speciesIconKey = animalTypeToIconKey(row.animal_type);

  return (
    <>
      <header className="bg-[#f9faf6] dark:bg-stone-950 flex justify-between items-center px-6 py-4 w-full sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            href="/cases"
            className="material-symbols-outlined text-[#0f5238] dark:text-emerald-500 hover:bg-[#e2e3df] dark:hover:bg-stone-800 transition-colors p-2 rounded-full active:scale-95 duration-150"
          >
            arrow_back
          </Link>
          <Link
            href="/cases"
            className="text-[#0f5238] dark:text-emerald-400 font-manrope font-extrabold text-xl cursor-pointer hover:opacity-80"
          >
            Case #{row.id.slice(0, 8)}
          </Link>
        </div>
      </header>

      <main className="px-6 mt-6 max-w-4xl mx-auto space-y-8 pb-32">
        <Link
          href={`/records?case=${id}`}
          className="flex items-center gap-6 p-2 cursor-pointer active:scale-[0.99]"
        >
          <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm relative bg-[var(--color-surface-container-highest)] flex items-center justify-center shrink-0">
            {speciesIconKey ? (
              <AnimalIcon animal={speciesIconKey} size={80} label={row.animal_type} className="max-h-20" />
            ) : (
              <span className="text-2xl font-bold text-[var(--color-primary)] capitalize">
                {row.animal_type.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-[var(--color-outline)] mb-1 block">
              {row.created_at
                ? new Date(row.created_at).toLocaleDateString()
                : ""}
            </span>
            <h2 className="text-3xl font-extrabold font-manrope text-[var(--color-primary)] tracking-tight capitalize">
              {row.animal_type}
            </h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">{subtitle}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)] px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                {row.status || "open"}
              </span>
            </div>
          </div>
        </Link>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-2 gap-4">
            <h2 className="text-xl font-bold font-manrope">Farm records</h2>
            <Link
              href={`/records?case=${id}`}
              className="text-sm font-bold text-[var(--color-primary)] shrink-0 hover:underline"
            >
              Upload
            </Link>
          </div>
          {attachedDocs && attachedDocs.length > 0 ? (
            <ul className="space-y-2">
              {attachedDocs.map((doc) => (
                <li
                  key={doc.id}
                  className="bg-[var(--color-surface-container-low)] px-4 py-3 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--color-primary)] shrink-0">
                      {doc.doc_type?.includes("pdf")
                        ? "picture_as_pdf"
                        : doc.doc_type?.startsWith("image")
                          ? "image"
                          : "description"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--color-on-surface)] truncate">{doc.title}</p>
                      <p className="text-xs text-[var(--color-outline)]">
                        {new Date(doc.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--color-on-surface-variant)] px-2">
              No documents linked yet. Use Upload to add PDFs, images, or receipts to this case.
            </p>
          )}
        </section>

        <section className="space-y-4 px-2">
          <div className="flex flex-wrap gap-3 text-sm font-bold">
            <Link
              href={`/follow-up?case=${id}`}
              className="text-[var(--color-primary)] hover:underline"
            >
              Follow-up
            </Link>
            <span className="text-[var(--color-outline)]">·</span>
            <Link href={`/treatment-options?case=${id}`} className="text-[var(--color-primary)] hover:underline">
              Treatments
            </Link>
            <span className="text-[var(--color-outline)]">·</span>
            <Link href="/analysis-result" className="text-[var(--color-primary)] hover:underline">
              Full analysis
            </Link>
          </div>
        </section>

        <section className="space-y-6">
          <Link
            href={`/follow-up?case=${id}`}
            className="text-xl font-bold font-manrope px-2 block cursor-pointer hover:text-[var(--color-primary)] w-fit"
          >
            Recovery Timeline
          </Link>
          <div className="space-y-4">
            {timeline.map((item, idx) => (
              <div
                key={idx}
                className="bg-[var(--color-surface-container-low)] p-6 rounded-xl flex items-center justify-between group hover:bg-[var(--color-surface-container-high)] transition-colors"
              >
                <div className="flex items-center gap-6">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                      idx === 0
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)]"
                    }`}
                  >
                    {timeline.length - idx}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{item.day}</p>
                    <p className="text-[var(--color-on-surface-variant)] text-sm">{item.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${badgeClass(item.status)}`}
                  >
                    {item.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 text-center">
          <Link
            href={`/follow-up?case=${id}`}
            className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--color-primary)] text-white rounded-full shadow-2xl font-headline font-bold tracking-tight hover:opacity-90 active:scale-90 duration-150"
          >
            <span>Add Follow-up Update</span>
            <span className="material-symbols-outlined">add</span>
          </Link>
        </div>
      </main>

      <BottomNavBar />
    </>
  );
}
