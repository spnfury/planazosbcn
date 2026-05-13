import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;

/**
 * Devuelve true si está permitido postear (cooldown superado o nunca posteado).
 * Devuelve false si ya se posteó con éxito en los últimos cooldownDays días.
 */
export async function shouldPost(platform, target, cooldownDays = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - cooldownDays);

  const { data } = await supabase
    .from("outreach_posts")
    .select("posted_at")
    .eq("platform", platform)
    .eq("target", target)
    .eq("status", "posted")
    .gte("posted_at", cutoff.toISOString())
    .limit(1);

  return !data?.length;
}
