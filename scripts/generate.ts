#!/usr/bin/env tsx
/**
 * One-shot CLI that kicks off the generation pipeline. Useful for local
 * seeding and for cron jobs that curl the API directly.
 *
 * Usage:
 *   npm run generate -- --topic=tech --count=3
 *   npm run generate -- --count=2                (all topics)
 */
import "dotenv/config";
import { generateAll, generateForTopic } from "../src/lib/generator";
import { hasGrok, hasSupabase } from "../src/lib/env";

function arg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.slice(name.length + 3) : undefined;
}

async function main() {
  if (!hasGrok()) {
    console.error("XAI_API_KEY missing");
    process.exit(1);
  }
  if (!hasSupabase()) {
    console.error("SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY missing");
    process.exit(1);
  }

  const topic = arg("topic");
  const count = Number(arg("count") ?? 3);

  if (topic) {
    const r = await generateForTopic({ topicSlug: topic, count });
    console.log(JSON.stringify(r, null, 2));
  } else {
    const r = await generateAll(count);
    console.log(JSON.stringify(r, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
