/**
 * Facebook group poster para PlanazosBCN
 *
 * Usa tu Chrome local (ya logueado en Facebook) para postear en grupos.
 * Arranca Chrome con:
 *   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
 *
 * Ejecutar: node scripts/outreach/facebook-poster.js
 * Un grupo concreto: node scripts/outreach/facebook-poster.js "Erasmus Barcelona 2025/2026"
 */

import puppeteer from "puppeteer-core";
import { FACEBOOK_POSTS, pick, logPost } from "./content.js";

// IDs/slugs de los grupos de Facebook (extraídos de la URL del grupo)
// Formato: facebook.com/groups/<GROUP_SLUG_OR_ID>
// Reemplaza con los IDs reales cuando los tengas
const GROUP_URLS = {
  // Buscar en Facebook y actualizar los slugs que marquen ⚠️
  "Erasmus Barcelona 2025/2026":
    "https://www.facebook.com/groups/ErasmusBarcelonaSpain/", // ESN Barcelona
  "Vivir en Barcelona — Expats":
    "https://www.facebook.com/groups/barcelonaexpatsgroup/", // ~10k members
  "Spaniards in Barcelona": "https://www.facebook.com/groups/spaniardsinbcn", // ⚠️ verificar
  "Eventos y planes en Barcelona":
    "https://www.facebook.com/groups/eventosenbarcelona/",
  "Italiani a Barcellona":
    "https://www.facebook.com/groups/italianiabarcellona/",
  "Français à Barcelone": "https://www.facebook.com/groups/francaisdebarcelone",
  "Jóvenes en Barcelona": "https://www.facebook.com/groups/jovenesbarcelona", // ⚠️ verificar
  "Barcelona Expat Hub":
    "https://www.facebook.com/groups/BarcelonaExpatsNetwork/", // 100K+ members
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const humanDelay = () => delay(Math.floor(Math.random() * 8000) + 5000);

async function connectChrome() {
  const res = await fetch("http://127.0.0.1:9222/json/version");
  const data = await res.json();
  return puppeteer.connect({
    browserWSEndpoint: data.webSocketDebuggerUrl,
    defaultViewport: null,
  });
}

async function postInGroup(page, groupUrl, text) {
  await page.goto(groupUrl, { waitUntil: "networkidle2" });
  await delay(3000);

  // Click en el campo "¿En qué estás pensando?" / "What's on your mind?"
  const triggers = [
    '[data-testid="status-attachment-mentions-input"]',
    'div[data-testid="react-composer-root"]',
    'div[aria-label*="pensando"]',
    'div[aria-label*="mind"]',
    'div[role="textbox"][contenteditable="true"]',
    'div[data-lexical-editor="true"]',
  ];

  let clicked = false;
  for (const sel of triggers) {
    try {
      const el = await page.$(sel);
      if (el) {
        await el.click();
        clicked = true;
        break;
      }
    } catch {}
  }

  if (!clicked) {
    // Intentar click en cualquier área que diga "pensando" o "mind"
    await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll("div, span, textarea"));
      const target = divs.find(
        (d) =>
          d
            .getAttribute("placeholder")
            ?.match(/pensando|mind|post|publicar/i) ||
          d.getAttribute("aria-label")?.match(/pensando|mind|post|publicar/i),
      );
      if (target) target.click();
    });
  }

  await delay(2000);

  // Escribir el texto
  await page.keyboard.type(text, { delay: 30 });
  await delay(2000);

  // Click en botón Publicar / Post
  const posted = await page.evaluate(() => {
    const btns = Array.from(
      document.querySelectorAll('div[role="button"], button'),
    );
    const postBtn = btns.find(
      (b) =>
        b.getAttribute("aria-label")?.match(/publicar|post/i) ||
        b.textContent?.match(/^(Publicar|Post)$/),
    );
    if (postBtn) {
      postBtn.click();
      return true;
    }
    return false;
  });

  if (!posted) throw new Error("No se encontró botón Publicar");
  await delay(4000);
}

async function run() {
  const targetGroup = process.argv[2];
  const groups = targetGroup
    ? Object.keys(FACEBOOK_POSTS).filter((g) => g === targetGroup)
    : Object.keys(FACEBOOK_POSTS);

  if (groups.length === 0) {
    console.error(`❌ Grupo "${targetGroup}" no encontrado en content.js`);
    process.exit(1);
  }

  // Verificar que los grupos tienen URL configurada
  const missingUrls = groups.filter((g) => !GROUP_URLS[g]);
  if (missingUrls.length > 0) {
    console.warn(
      `⚠️  Grupos sin URL configurada en GROUP_URLS (edita facebook-poster.js):\n  ${missingUrls.join("\n  ")}`,
    );
  }

  console.log("🚀 Iniciando Facebook poster...");

  let browser;
  try {
    browser = await connectChrome();
    console.log("✅ Conectado a Chrome\n");
  } catch {
    console.error(
      "❌ Chrome no disponible en puerto 9222.\nArrancar con:\n /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222",
    );
    process.exit(1);
  }

  const results = [];

  for (const group of groups) {
    const url = GROUP_URLS[group];
    if (!url) {
      results.push({ group, status: "⏭️ SKIP", error: "Sin URL configurada" });
      continue;
    }

    const post = FACEBOOK_POSTS[group];
    const text = post.text;

    console.log(`→ Publicando en "${group}"...`);
    const page = await browser.newPage();

    try {
      await postInGroup(page, url, text);
      results.push({ group, status: "✅ OK" });
      console.log(`  ✅ Publicado`);
      await logPost({ platform: "facebook", target: group, status: "posted" });
    } catch (err) {
      results.push({ group, status: "❌ ERROR", error: err.message });
      console.log(`  ❌ Error: ${err.message}`);
      await logPost({
        platform: "facebook",
        target: group,
        status: "failed",
        notes: err.message,
      });
      try {
        await page.screenshot({
          path: `screenshot-fb-${group.replace(/[^a-z0-9]/gi, "-")}.png`,
        });
      } catch {}
    } finally {
      await page.close();
    }

    if (groups.indexOf(group) < groups.length - 1) {
      const waitMin = 15;
      console.log(
        `  ⏳ Esperando ${waitMin} min para evitar spam detection...`,
      );
      await delay(waitMin * 60 * 1000);
    }
  }

  browser.disconnect();
  console.log("\n📊 RESUMEN:");
  console.table(results);
}

run();
