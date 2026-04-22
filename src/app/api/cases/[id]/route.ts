import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  CASE_API_GET_SELECT_NO_NAME,
  CASE_API_GET_SELECT_WITH_NAME,
  isMissingDisplayNameColumn,
} from "@/lib/case-detail-select";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase.from("profiles").select("region").eq("id", user.id).maybeSingle();

    let { data: row, error } = await supabase
      .from("cases")
      .select(CASE_API_GET_SELECT_WITH_NAME)
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error && isMissingDisplayNameColumn(error)) {
      const r2 = await supabase
        .from("cases")
        .select(CASE_API_GET_SELECT_NO_NAME)
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      row = r2.data ? { ...r2.data, display_name: null } : null;
      error = r2.error;
    }

    if (error || !row) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const assessments = Array.isArray(row.ai_assessments) ? row.ai_assessments : row.ai_assessments ? [row.ai_assessments] : [];
    const sortedAssess = [...assessments].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
    const latest = sortedAssess[0] ?? null;

    const followups = Array.isArray(row.followups) ? row.followups : [];
    const sortedFollowups = [...followups].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      region: profile?.region ?? "Northern Highlands District",
      case: {
        id: row.id,
        display_name: row.display_name,
        animal_type: row.animal_type,
        health_status: row.health_status,
        status: row.status,
        confidence: row.confidence,
        created_at: row.created_at,
      },
      followups: sortedFollowups,
      /** Newest first — full history for merged case reports */
      assessments: sortedAssess,
      latest_assessment: latest,
    });
  } catch (e) {
    console.error("GET /api/cases/[id]", e);
    return NextResponse.json({ error: "Failed to load case" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { display_name?: unknown; monitoring_active?: unknown };
    const updates: Record<string, string | boolean | null> = {};

    if (typeof body.display_name === "string") {
      const trimmed = body.display_name.trim().slice(0, 120);
      updates.display_name = trimmed.length ? trimmed : null;
    }
    if (typeof body.monitoring_active === "boolean") {
      updates.monitoring_active = body.monitoring_active;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Provide display_name and/or monitoring_active" }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from("cases")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, display_name, monitoring_active")
      .maybeSingle();

    if (error) throw error;
    if (!updated) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      display_name: updated.display_name,
      monitoring_active: updated.monitoring_active,
    });
  } catch (e) {
    console.error("PATCH /api/cases/[id]", e);
    return NextResponse.json({ error: "Failed to update case" }, { status: 500 });
  }
}
