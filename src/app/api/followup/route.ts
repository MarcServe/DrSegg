import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const progressStatus = status || "improving";

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
