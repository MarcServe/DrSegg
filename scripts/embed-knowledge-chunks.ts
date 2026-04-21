/**
 * Backfills public.knowledge_condition_chunks.embedding using OpenAI text-embedding-3-small.
 *
 * Loads `.env.local` and `.env` from the repo root when present (no extra CLI flags).
 * Required variables:
 * - OPENAI_API_KEY
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (writes past RLS; never ship to the browser)
 *
 * Run: pnpm run embed:knowledge-chunks
 */

/* eslint-disable no-console */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { embedTexts } from "../src/lib/ai/embeddings";

function loadLocalEnv(): void {
  for (const name of [".env.local", ".env"]) {
    const p = resolve(process.cwd(), name);
    if (!existsSync(p)) continue;
    const txt = readFileSync(p, "utf8");
    for (const line of txt.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 1) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

const BATCH = 20;

async function main() {
  loadLocalEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Service role is required to update embeddings."
    );
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: rows, error: selErr } = await supabase
    .from("knowledge_condition_chunks")
    .select("id, chunk_text")
    .is("embedding", null)
    .order("id", { ascending: true });

  if (selErr) {
    console.error("Select failed:", selErr.message);
    process.exit(1);
  }

  const pending = (rows ?? []).filter((r) => typeof r.chunk_text === "string" && r.chunk_text.trim().length > 0);
  if (pending.length === 0) {
    console.log("No chunks with NULL embedding (or empty chunk_text). Nothing to do.");
    return;
  }

  console.log(`Embedding ${pending.length} chunk(s) in batches of ${BATCH}…`);

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < pending.length; i += BATCH) {
    const slice = pending.slice(i, i + BATCH);
    const texts = slice.map((row) => row.chunk_text);
    const vectors = await embedTexts(texts);

    for (let j = 0; j < slice.length; j++) {
      const embed = vectors[j];
      const id = slice[j].id;
      if (!embed || embed.length === 0) {
        console.warn(`Skip ${id}: no embedding returned`);
        fail++;
        continue;
      }

      const { error: upErr } = await supabase
        .from("knowledge_condition_chunks")
        .update({ embedding: embed })
        .eq("id", id);

      if (upErr) {
        console.warn(`Update failed for ${id}:`, upErr.message);
        fail++;
        continue;
      }
      ok++;
    }
    if (i + BATCH < pending.length) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  console.log(`Done. Updated: ${ok}, failed: ${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
