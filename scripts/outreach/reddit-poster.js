/**
 * Reddit poster para PlanazosBCN
 *
 * Setup:
 * 1. Ve a https://www.reddit.com/prefs/apps → "create another app" → script
 * 2. Pon redirect_uri = http://localhost:8080
 * 3. Copia client_id (bajo el nombre) y client_secret
 * 4. Añade al .env.local:
 *    REDDIT_CLIENT_ID=xxx
 *    REDDIT_CLIENT_SECRET=xxx
 *    REDDIT_USERNAME=tu_usuario
 *    REDDIT_PASSWORD=tu_contraseña
 *
 * Ejecutar: node scripts/outreach/reddit-poster.js
 * Para un subreddit concreto: node scripts/outreach/reddit-poster.js r/Barcelona
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { REDDIT_POSTS, pick, logPost } from "./content.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const {
  REDDIT_CLIENT_ID,
  REDDIT_CLIENT_SECRET,
  REDDIT_USERNAME,
  REDDIT_PASSWORD,
} = process.env;

if (
  !REDDIT_CLIENT_ID ||
  !REDDIT_CLIENT_SECRET ||
  !REDDIT_USERNAME ||
  !REDDIT_PASSWORD
) {
  console.error(
    "❌ Faltan variables de entorno Reddit.\nAñade al .env.local:\n  REDDIT_CLIENT_ID\n  REDDIT_CLIENT_SECRET\n  REDDIT_USERNAME\n  REDDIT_PASSWORD",
  );
  process.exit(1);
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function getAccessToken() {
  const creds = Buffer.from(
    `${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`,
  ).toString("base64");
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "PlanazosBCN/1.0 by " + REDDIT_USERNAME,
    },
    body: new URLSearchParams({
      grant_type: "password",
      username: REDDIT_USERNAME,
      password: REDDIT_PASSWORD,
    }),
  });
  const data = await res.json();
  if (!data.access_token)
    throw new Error("Token fallido: " + JSON.stringify(data));
  return data.access_token;
}

async function submitPost(token, subreddit, title, text) {
  const sub = subreddit.replace(/^r\//, "");
  const res = await fetch("https://oauth.reddit.com/api/submit", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "PlanazosBCN/1.0 by " + REDDIT_USERNAME,
    },
    body: new URLSearchParams({
      sr: sub,
      kind: "self",
      title,
      text,
      nsfw: "false",
      spoiler: "false",
    }),
  });
  const data = await res.json();
  if (data.json?.errors?.length) {
    throw new Error(data.json.errors.map((e) => e[1]).join(", "));
  }
  const url = data.json?.data?.url;
  return url;
}

async function run() {
  // Si se pasa un subreddit como arg, solo postea en ese
  const targetSub = process.argv[2];
  const subreddits = targetSub
    ? Object.keys(REDDIT_POSTS).filter((s) => s === targetSub)
    : Object.keys(REDDIT_POSTS);

  if (subreddits.length === 0) {
    console.error(`❌ Subreddit "${targetSub}" no encontrado en content.js`);
    process.exit(1);
  }

  console.log("🔑 Autenticando con Reddit...");
  let token;
  try {
    token = await getAccessToken();
    console.log("✅ Autenticado\n");
  } catch (err) {
    console.error("❌ Auth fallida:", err.message);
    process.exit(1);
  }

  const results = [];

  for (const sub of subreddits) {
    const post = REDDIT_POSTS[sub];
    const title = pick(post.title);
    const body = pick(post.body);

    console.log(`→ Publicando en ${sub}...`);
    console.log(`  Título: ${title}`);

    try {
      const url = await submitPost(token, sub, title, body);
      results.push({ subreddit: sub, status: "✅ OK", url });
      console.log(`  ✅ Publicado: ${url}`);
      await logPost({ platform: "reddit", target: sub, status: "posted", url });
    } catch (err) {
      results.push({ subreddit: sub, status: "❌ ERROR", error: err.message });
      console.log(`  ❌ Error: ${err.message}`);
      await logPost({
        platform: "reddit",
        target: sub,
        status: "failed",
        notes: err.message,
      });
    }

    // Espera entre posts para evitar rate limit (recomendado ≥10 min entre subreddits)
    if (subreddits.indexOf(sub) < subreddits.length - 1) {
      const waitMin = 12;
      console.log(`  ⏳ Esperando ${waitMin} min antes del siguiente post...`);
      await delay(waitMin * 60 * 1000);
    }
  }

  console.log("\n📊 RESUMEN:");
  console.table(results);
}

run();
