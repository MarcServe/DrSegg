/**
 * Case-aware copy for the monitoring checklist (eating / water / movement / visual).
 * Heuristic, deterministic — not a second LLM call. Grounds tips in species + reported signs.
 */

export type MonitoringTrack = "eating" | "water" | "movement" | "visual";

export type MonitoringContext = {
  species: string;
  symptoms: string[];
  suggestedNextChecks: string[];
  possibleConditions: string[];
  redFlags: string[];
};

function hay(ctx: MonitoringContext): string {
  return [
    ...ctx.symptoms,
    ...ctx.suggestedNextChecks,
    ...ctx.possibleConditions,
    ...ctx.redFlags,
  ]
    .join(" ")
    .toLowerCase();
}

function isPoultry(s: string): boolean {
  const l = s.toLowerCase();
  return l === "poultry" || l === "chicken" || l === "bird";
}

export function getMonitoringChecklistIntro(ctx: MonitoringContext): string {
  const h = hay(ctx);
  if (h.includes("diarr") || h.includes("scour") || h.includes("droppings") || h.includes("feces")) {
    return "Your case mentions gut or droppings — watch appetite and water closely; note anything sudden.";
  }
  if (h.includes("respir") || h.includes("cough") || h.includes("sneez") || h.includes("nasal")) {
    return "Your case has respiratory context — log behaviour and who is affected, and note water intake.";
  }
  if (h.includes("lame") || h.includes("limping") || h.includes("weak") || h.includes("paralysis")) {
    return "Your case has movement or strength concerns — log who is affected and over what period.";
  }
  return "Use the sections below to log what you see between vet visits. Short notes and dated photos help your vet.";
}

type Pack = {
  title: string;
  section: string;
  lead: string;
  tips: string[];
  tipBox: string;
  uploadLabel: string;
  heroIcon: "restaurant" | "water_drop" | "directions_run" | "visibility";
  progressPct: number;
};

function basePack(
  track: MonitoringTrack,
  sp: string,
  ctx: MonitoringContext
): { tips: string[]; extra: string } {
  const h = hay(ctx);
  const tips: string[] = [];
  let extra = "";

  if (track === "eating") {
    if (isPoultry(sp)) {
      tips.push("Count or estimate what share of the flock is at the feeder — drop-offs often show first.");
      tips.push("Note pecking order changes, toss feed, or sudden silence at feeding time.");
    } else if (["goat", "cattle", "cow", "sheep"].includes(sp.toLowerCase())) {
      tips.push("Compare cudding / chewing time to normal; note left feed or bloating.");
    } else {
      tips.push("Offer normal feed at the usual time; note refusal, vomiting, or slower chewing.");
    }
    if (h.includes("diarr") || h.includes("vomit") || h.includes("bloat")) {
      tips.push("A sharp drop in eating together with gut signs is worth flagging to your vet.");
    }
  }

  if (track === "water") {
    tips.push("Check drinkers: flow rate, height for the species, algae, and ice in cold weather.");
    if (h.includes("heat") || h.includes("pant")) {
      tips.push("For heat-related concern: cool water, shade, and more frequent small drinks matter.");
    }
    if (isPoultry(sp)) {
      tips.push("Note birds hanging around waterers or avoiding the drinker line.");
    }
    if (h.includes("diarr") || h.includes("dehydrat")) {
      extra =
        "Dehydration can worsen quickly — if drinking drops with gut signs, escalate with your vet.";
    }
  }

  if (track === "movement") {
    tips.push("Film a short, level walk: start/stop, head carriage, and how the group moves to feed or water.");
    if (h.includes("neurol") || h.includes("twist") || h.includes("circl") || h.includes("seizur")) {
      extra =
        "Neurologic or odd posture needs prompt vet input — this log supports timing, not a diagnosis.";
    } else {
      tips.push("Note isolation, falls, or animals left behind by the group.");
    }
  }

  if (track === "visual") {
    tips.push("Use steady, indirect light; hold the phone still so detail stays sharp.");
  }

  return { tips, extra };
}

function progressForTrack(t: MonitoringTrack): number {
  switch (t) {
    case "eating":
      return 28;
    case "water":
      return 52;
    case "movement":
      return 78;
    default:
      return 35;
  }
}

function heroForTrack(t: MonitoringTrack): Pack["heroIcon"] {
  switch (t) {
    case "eating":
      return "restaurant";
    case "water":
      return "water_drop";
    case "movement":
      return "directions_run";
    default:
      return "visibility";
  }
}

export function getMonitoringContent(track: MonitoringTrack, ctx: MonitoringContext): Pack {
  const sp = ctx.species?.trim() || "animal";
  const label = isPoultry(sp) ? "flock" : sp;
  const { tips, extra } = basePack(track, sp, ctx);

  const merged: string[] = [...tips];
  if (track === "eating" && merged.length < 2) {
    merged.push(
      `Watch normal meal patterns for this ${label}; a sudden change often matters more than a single off day.`
    );
  }
  if (track === "water" && merged.length < 2) {
    merged.push("Measure or mark water levels if you can — a clear before/after helps your vet.");
  }
  if (track === "movement" && merged.length < 2) {
    merged.push("Note time of day, weather, and whether others in the group look the same.");
  }

  const allTips = [...new Set(merged)].slice(0, 6);
  const spLower = sp.toLowerCase();
  const heroIcon = heroForTrack(track);
  const progressPct = progressForTrack(track);

  if (track === "eating") {
    return {
      title: "Eating & appetite",
      section: "Monitoring — eating habits",
      lead: `For this ${spLower} case, track appetite and how feed is used — not only “eating less” in general.`,
      tips: allTips,
      tipBox:
        extra ||
        "Jot the date and time of what you see; photos of leftover feed or unusual droppings can attach to the case.",
      uploadLabel: "Guided monitoring — eating",
      heroIcon,
      progressPct,
    };
  }
  if (track === "water") {
    return {
      title: "Drinking & water",
      section: "Monitoring — drinking water",
      lead: `For this case, log water intake and drinker use for your ${spLower} — change often shows before other signs.`,
      tips: allTips,
      tipBox:
        extra ||
        "If several animals are involved, say whether it’s the whole group or a few individuals.",
      uploadLabel: "Guided monitoring — water",
      heroIcon,
      progressPct,
    };
  }
  if (track === "movement") {
    return {
      title: "Movement & behaviour",
      section: "Monitoring — movement / behaviour",
      lead: `Relate what you see to this case: lameness, isolation, or unusual posture for your ${spLower}.`,
      tips: allTips,
      tipBox:
        extra ||
        "Short clips beat long narrations; 10–20 seconds of normal walking is often enough for your vet to triage next steps.",
      uploadLabel: "Guided monitoring — movement",
      heroIcon,
      progressPct,
    };
  }
  return {
    title: "The eyes",
    section: "Guided checklist — visual inspection",
    lead:
      "Check both eyes closely. Look for discharge, cloudiness, or unusual redness around the socket. Files attach to this case for review with your other records.",
    tips: allTips,
    tipBox: extra || "Healthy eyes are usually bright. Avoid harsh glare; steady the phone for clearer review.",
    uploadLabel: "Guided inspection — eyes",
    heroIcon,
    progressPct,
  };
}

export function parseMonitoringTrack(raw: string | null): MonitoringTrack {
  const t = (raw ?? "").toLowerCase().trim();
  if (t === "eating" || t === "food" || t === "appetite") return "eating";
  if (t === "water" || t === "drink" || t === "drinking" || t === "hydration") return "water";
  if (t === "movement" || t === "behavior" || t === "behaviour" || t === "locomotion") return "movement";
  return "visual";
}

/** `track` null or `visual` → no `track` query (defaults to eyes checklist when combined with `case`). */
export function buildGuidedInspectionPath(caseId: string | null, track: MonitoringTrack | null): string {
  const t: MonitoringTrack = track ?? "visual";
  const params = new URLSearchParams();
  if (caseId) params.set("case", caseId);
  if (t !== "visual") params.set("track", t);
  const q = params.toString();
  return q ? `/guided-inspection?${q}` : "/guided-inspection";
}
