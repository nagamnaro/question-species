/**
 * Backfill heuristic insights for questions with 2+ responses and no cache.
 *
 * Usage: npm run backfill-insights
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (Supabase → Project Settings → API → service_role)
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createAdminClient } from "../lib/supabase/admin";
import { generateHeuristicInsights } from "../features/insights/heuristic-clusters";
import type { ResponseWithUser } from "../features/responses/queries";
import type { Json, Species } from "../types";

function parseEnvValue(raw: string): string {
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value;
}

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;

  const content = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = parseEnvValue(trimmed.slice(eq + 1));
    if (!process.env[key]) process.env[key] = value;
  }
}

function ensureEnv() {
  loadEnvLocal();

  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  if (missing.length > 0) {
    console.error("Missing environment variables:", missing.join(", "));
    console.error("");
    console.error("Add them to .env.local in the project root.");
    console.error(
      "SUPABASE_SERVICE_ROLE_KEY: Supabase Dashboard → Project Settings → API → service_role",
    );
    console.error("(Never commit this key or expose it in the browser.)");
    process.exit(1);
  }
}

async function main() {
  ensureEnv();
  const supabase = createAdminClient();

  const { data: insightRows, error: insightError } = await supabase
    .from("question_insights")
    .select("question_id");

  if (insightError) {
    console.error("Failed to list insights:", insightError.message);
    process.exit(1);
  }

  const cachedIds = new Set((insightRows ?? []).map((row) => row.question_id));

  const { data: questions, error: questionError } = await supabase
    .from("questions")
    .select("id, text, species");

  if (questionError) {
    console.error("Failed to list questions:", questionError.message);
    process.exit(1);
  }

  let processed = 0;
  let skipped = 0;

  for (const question of questions ?? []) {
    if (cachedIds.has(question.id)) {
      skipped += 1;
      continue;
    }

    const { data: responses, error: responseError } = await supabase
      .from("responses")
      .select(
        "id, user_id, question_id, answer_text, reasoning_text, prediction_value, created_at, updated_at, users(display_name)",
      )
      .eq("question_id", question.id);

    if (responseError) {
      console.error(`Responses for ${question.id}:`, responseError.message);
      continue;
    }

    if (!responses || responses.length < 2) {
      skipped += 1;
      continue;
    }

    const payload = generateHeuristicInsights(
      {
        text: question.text,
        species: question.species as Species,
      },
      responses as unknown as ResponseWithUser[],
    );

    const { error: saveError } = await supabase.from("question_insights").upsert(
      {
        question_id: question.id,
        clusters_json: payload.clusters as unknown as Json,
        summary_text: payload.summary_text,
        last_updated: new Date().toISOString(),
      },
      { onConflict: "question_id" },
    );

    if (saveError) {
      console.error(`Save ${question.id}:`, saveError.message);
      continue;
    }

    processed += 1;
    console.log(`Cached insights: ${question.text.slice(0, 60)}…`);
  }

  console.log(`Done. Processed ${processed}, skipped ${skipped}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
