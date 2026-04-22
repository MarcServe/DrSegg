import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");
    if (!caseId || !UUID_RE.test(caseId)) {
      return NextResponse.json({ error: "Valid caseId query parameter required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const { data: rows, error } = await supabase
      .from("followups")
      .select("id, created_at, notes, status")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ followups: rows ?? [] });
  } catch (error) {
    console.error("Followup GET Error:", error);
    return NextResponse.json({ error: "Failed to load follow-ups" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { caseId, notes, status } = data;
    const progressStatus = status && String(status).trim() ? String(status).trim() : "unchanged";

    if (!caseId) {
      return NextResponse.json({ error: "caseId is required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const { error } = await supabase.from("followups").insert({
      case_id: caseId,
      notes: notes || "Daily check-in",
      status: progressStatus,
    });

    if (error) throw error;

    const { error: actErr } = await supabase
      .from("cases")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", caseId)
      .eq("user_id", user.id);
    if (actErr) console.warn("followup last_activity_at:", actErr);

    return NextResponse.json({
      success: true,
      status: progressStatus,
      message: `Follow-up recorded. Status: ${progressStatus}`,
    });
  } catch (error) {
    console.error("Followup Error:", error);
    return NextResponse.json({ error: "Failed to record follow-up" }, { status: 500 });
  }
}
