import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Authenticated list of symptom canonical names + aliases for client-side expansion / matching.
 * Row set is small; filter client-side if needed.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("symptom_dictionary")
      .select("id, canonical_name, aliases, animal_types, category, created_at")
      .order("canonical_name", { ascending: true });

    if (error) {
      console.error("symptom-dictionary", error);
      return NextResponse.json({ error: "Failed to load symptom dictionary" }, { status: 500 });
    }

    return NextResponse.json({ symptoms: data ?? [] });
  } catch (e) {
    console.error("symptom-dictionary", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
