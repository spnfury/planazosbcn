import puppeteer from "puppeteer-core";
import { GROUP, logPost } from "./content.js";
import { shouldPost } from "./db.js";

async function connectChrome() {
  const res = await fetch("http://127.0.0.1:9222/json/version");
  const data = await res.json();
  return puppeteer.connect({
    browserWSEndpoint: data.webSocketDebuggerUrl,
    defaultViewport: null,
  });
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Cada handler recibe (page, GROUP) y devuelve { success, message }
const DIRECTORIES = [
  {
    name: "whatsgrouplinks.com",
    submitUrl: "https://www.whatsgrouplinks.com/submit-group/",
    handler: async (page) => {
      await page.goto("https://www.whatsgrouplinks.com/submit-group/", {
        waitUntil: "networkidle2",
      });
      await delay(2000);
      await page.type(
        'input[name="group_name"], input[name="name"], #group_name',
        GROUP.name,
        { delay: 80 },
      );
      await page.type(
        'input[name="group_link"], input[name="link"], #group_link',
        GROUP.link,
        { delay: 80 },
      );
      const descField = await page.$(
        'textarea[name="description"], textarea[name="desc"], #description',
      );
      if (descField)
        await page.type(
          'textarea[name="description"], textarea[name="desc"], #description',
          GROUP.description_short,
          { delay: 50 },
        );
      await page.click('button[type="submit"], input[type="submit"]');
      await delay(3000);
    },
  },
  {
    name: "groupslor.com",
    submitUrl: "https://groupslor.com/submit/",
    handler: async (page) => {
      await page.goto("https://groupslor.com/submit/", {
        waitUntil: "networkidle2",
      });
      await delay(2000);
      await fillGenericForm(page);
    },
  },
  {
    name: "whatsgrouplink.com",
    submitUrl: "https://www.whatsgrouplink.com/submit-group/",
    handler: async (page) => {
      await page.goto("https://www.whatsgrouplink.com/submit-group/", {
        waitUntil: "networkidle2",
      });
      await delay(2000);
      await fillGenericForm(page);
    },
  },
  {
    name: "chatlinks.app",
    submitUrl: "https://chatlinks.app/submit",
    handler: async (page) => {
      await page.goto("https://chatlinks.app/submit", {
        waitUntil: "networkidle2",
      });
      await delay(2000);
      await fillGenericForm(page);
    },
  },
  {
    name: "grouplinks.app",
    submitUrl: "https://grouplinks.app/submit",
    handler: async (page) => {
      await page.goto("https://grouplinks.app/submit", {
        waitUntil: "networkidle2",
      });
      await delay(2000);
      await fillGenericForm(page);
    },
  },
  {
    name: "whatsapp-group-links.com",
    submitUrl: "https://www.whatsapp-group-links.com/submit-group/",
    handler: async (page) => {
      await page.goto("https://www.whatsapp-group-links.com/submit-group/", {
        waitUntil: "networkidle2",
      });
      await delay(2000);
      await fillGenericForm(page);
    },
  },
  {
    name: "grupo-whatsapp.com",
    submitUrl: "https://grupo-whatsapp.com/submit",
    handler: async (page) => {
      await page.goto("https://grupo-whatsapp.com/submit", {
        waitUntil: "networkidle2",
      });
      await delay(2000);
      await fillGenericForm(page);
    },
  },
  {
    name: "invitacionalgrupo.com",
    submitUrl: "https://invitacionalgrupo.com/agregar-grupo/",
    handler: async (page) => {
      await page.goto("https://invitacionalgrupo.com/agregar-grupo/", {
        waitUntil: "networkidle2",
      });
      await delay(2000);
      await fillGenericForm(page);
    },
  },
  {
    name: "comuniza.es",
    submitUrl: "https://comuniza.es/submit",
    handler: async (page) => {
      await page.goto("https://comuniza.es/submit", {
        waitUntil: "networkidle2",
      });
      await delay(2000);
      await fillGenericForm(page);
    },
  },
  {
    name: "gruposdewhatsapp.online",
    submitUrl: "https://gruposdewhatsapp.online/submit",
    handler: async (page) => {
      await page.goto("https://gruposdewhatsapp.online/submit", {
        waitUntil: "networkidle2",
      });
      await delay(2000);
      await fillGenericForm(page);
    },
  },
];

// Intento genérico: busca campos comunes por múltiples selectores
async function fillGenericForm(page) {
  const tryFill = async (selectors, value) => {
    for (const sel of selectors) {
      try {
        const el = await page.$(sel);
        if (el) {
          await page.type(sel, value, { delay: 80 });
          return true;
        }
      } catch {}
    }
    return false;
  };

  await tryFill(
    [
      'input[name="group_name"]',
      'input[name="name"]',
      'input[name="title"]',
      "#group_name",
      "#name",
      "#title",
    ],
    GROUP.name,
  );
  await tryFill(
    [
      'input[name="group_link"]',
      'input[name="link"]',
      'input[name="url"]',
      'input[name="invite_link"]',
      "#link",
      "#url",
      "#group_link",
    ],
    GROUP.link,
  );
  await tryFill(
    [
      'textarea[name="description"]',
      'textarea[name="desc"]',
      'textarea[name="about"]',
      "#description",
      "#desc",
      "#about",
    ],
    GROUP.description_long,
  );
  await tryFill(['input[name="email"]', "#email"], GROUP.email);
  // Intentar seleccionar categoría
  try {
    const catSel = await page.$('select[name="category"], select[name="cat"]');
    if (catSel) {
      await page.select(
        'select[name="category"], select[name="cat"]',
        "Entertainment",
      );
    }
  } catch {}
  // Intentar seleccionar país
  try {
    const countrySel = await page.$('select[name="country"]');
    if (countrySel) {
      await page.select('select[name="country"]', "Spain");
    }
  } catch {}

  // Submit
  try {
    await page.click(
      'button[type="submit"], input[type="submit"], button.submit',
    );
  } catch {
    // Algunas páginas usan formularios sin botón estándar
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const sub = btns.find((b) =>
        /submit|send|add|enviar|añadir|agregar/i.test(b.textContent),
      );
      if (sub) sub.click();
    });
  }
  await delay(3000);
}

async function run() {
  console.log("🚀 Iniciando submisión a directorios WhatsApp...");
  console.log(`📱 Grupo: ${GROUP.link}`);

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

  for (const dir of DIRECTORIES) {
    const ok = await shouldPost("whatsapp_directory", dir.name, 30);
    if (!ok) {
      console.log(
        `⏭  ${dir.name} — cooldown activo (posteado en últimos 30 días)`,
      );
      continue;
    }
    const page = await browser.newPage();
    console.log(`→ Procesando ${dir.name}...`);
    try {
      await dir.handler(page);
      const url = page.url();
      results.push({ site: dir.name, status: "✅ OK", url });
      console.log(`  ✅ Enviado — ${url}`);
      await logPost({
        platform: "whatsapp_directory",
        target: dir.name,
        status: "posted",
        url,
      });
    } catch (err) {
      results.push({ site: dir.name, status: "❌ ERROR", error: err.message });
      console.log(`  ❌ Error: ${err.message}`);
      await logPost({
        platform: "whatsapp_directory",
        target: dir.name,
        status: "failed",
        notes: err.message,
      });
      try {
        await page.screenshot({
          path: `screenshot-${dir.name.replace(/\./g, "-")}.png`,
        });
      } catch {}
    } finally {
      await page.close();
    }
    await delay(2000);
  }

  browser.disconnect();

  console.log("\n📊 RESUMEN:");
  console.table(results);
}

run();
