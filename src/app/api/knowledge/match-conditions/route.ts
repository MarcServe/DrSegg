import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { matchConditions } from "@/lib/ai/knowledge-match";

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
    const species = String(body.species ?? body.animal ?? "").trim();
    const region = String(body.region ?? "").trim() || "Northern Highlands District";
    const symptoms = Array.isArray(body.symptoms)
      ? body.symptoms.map((s: unknown) => String(s).trim()).filter(Boolean)
      : [];

    if (!species) {
      return NextResponse.json({ error: "species is required" }, { status: 400 });
    }

    const matches = await matchConditions(supabase, species, symptoms, region);

    return NextResponse.json({ matches });
  } catch (e) {
    console.error("match-conditions", e);
    return NextResponse.json({ error: "Failed to match conditions" }, { status: 500 });
  }
}
