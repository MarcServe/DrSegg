import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Suggests follow-up capture prompts using body_part_capture_guides (+ symptom keywords).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const species = String(body.species ?? "").trim();
    const symptomBlob = String(body.symptom_text ?? body.symptoms ?? "").toLowerCase();

    if (!species) {
      return NextResponse.json({ error: "species is required" }, { status: 400 });
    }

    const { data: guides, error } = await supabase
      .from("body_part_capture_guides")
      .select("requested_body_part, guide_title, guide_text, symptom_trigger")
      .eq("species", species);

    if (error) throw error;

    const list = (guides ?? []).filter((g) => {
      if (!g.symptom_trigger) return true;
      return symptomBlob.includes(g.symptom_trigger.toLowerCase());
    });

    const questions: string[] = [];
    const capture_guides = list.map((g) => ({
      body_part: g.requested_body_part,
      guide: g.guide_text,
      title: g.guide_title,
    }));

    if (symptomBlob.includes("diarr") || symptomBlob.includes("stool")) {
      questions.push("How many animals are affected, and for how long?");
      questions.push("Any deaths in the last 24–48 hours?");
    }
    if (symptomBlob.includes("respir") || symptomBlob.includes("cough")) {
      questions.push("Is breathing noisy at rest? Any nasal discharge?");
    }

    return NextResponse.json({
      needs_more_info: questions.length > 0 || capture_guides.length > 0,
      questions,
      capture_guides,
    });
  } catch (e) {
    console.error("request-more-info", e);
    return NextResponse.json({ error: "Failed to build follow-up prompts" }, { status: 500 });
  }
}
