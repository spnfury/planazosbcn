// ============================================
// Planazos BCN — Directory submission runner
//
// Uso:
//   1. cd scripts/submit-directories
//   2. npm install
//   3. npm run install:browsers       # primera vez
//   4. npm run run                    # headless
//      npm run run:headed             # con UI (recomendado primera vez)
//      npm run run:dry                # solo abre sitios, no envía
//
// Variables:
//   HEADED=1     → abre Chrome visible
//   ONLY=id1,id2 → ejecuta solo esos directorios
//   DRY_RUN=1    → no hace submit, solo navega y autofill
// ============================================

import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { chromium } from 'playwright';

const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const PROGRESS_PATH = path.join(__dirname, 'progress.json');

const HEADED = process.env.HEADED === '1';
const DRY_RUN = process.env.DRY_RUN === '1';
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);

const rl = readline.createInterface({ input: stdin, output: stdout });

async function ask(q) {
  return (await rl.question(q)).trim();
}

async function loadJSON(file) {
  const raw = await fs.readFile(path.join(__dirname, file), 'utf8');
  return JSON.parse(raw);
}

async function saveProgress(progress) {
  await fs.writeFile(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

async function loadProgress() {
  try {
    return JSON.parse(await fs.readFile(PROGRESS_PATH, 'utf8'));
  } catch {
    return {};
  }
}

// ── Field classifier (mirrors the bookmarklet logic) ───────────────────
const FIELD_KEYS = {
  title: ['title', 'name', 'nombre', 'titulo', 'heading'],
  desc: ['desc', 'description', 'descripcion', 'about', 'bio', 'summary', 'content', 'body'],
  url: ['url', 'link', 'website', 'web', 'site', 'enlace'],
  tags: ['tag', 'tags', 'keyword', 'keywords', 'etiqueta', 'etiquetas'],
  wa: ['whatsapp', 'wa-link', 'grupo'],
  email: ['email', 'mail', 'correo'],
};

async function classify(handle) {
  return handle.evaluate((el) => {
    const blob = [
      el.name || '', el.id || '', el.placeholder || '', el.getAttribute('aria-label') || '',
    ].join(' ').toLowerCase();
    let label = '';
    if (el.labels) {
      for (const l of el.labels) label += ' ' + (l.textContent || '');
    }
    const parent = el.closest('label, .field, .form-group, .form-row, fieldset');
    if (parent) label += ' ' + (parent.textContent || '').slice(0, 120);
    return (blob + ' ' + label).toLowerCase();
  });
}

async function autofillPage(page, payload) {
  const inputs = await page.$$('input[type=text], input[type=url], input[type=email], input[type=search], input:not([type]), textarea');
  let filled = 0;
  for (const inp of inputs) {
    const visible = await inp.isVisible().catch(() => false);
    if (!visible) continue;
    const editable = await inp.isEditable().catch(() => false);
    if (!editable) continue;
    const current = await inp.inputValue().catch(() => '');
    if (current) continue;

    const blob = await classify(inp);
    const has = (list) => list.some((w) => blob.includes(w));

    let value = null;
    if (has(FIELD_KEYS.wa)) value = payload.groupUrl;
    else if (has(FIELD_KEYS.url)) value = payload.webUrl;
    else if (has(FIELD_KEYS.email)) value = payload.email;
    else if (has(FIELD_KEYS.tags)) value = payload.tags;
    else if (has(FIELD_KEYS.title)) value = payload.title;
    else if (has(FIELD_KEYS.desc)) {
      const max = await inp.getAttribute('maxlength').then((m) => parseInt(m || '0', 10));
      value = max > 0 && max < 220 ? payload.descShort : payload.descLong;
    }

    if (value) {
      try {
        await inp.fill(value, { timeout: 1500 });
        filled++;
      } catch {}
    }
  }
  return filled;
}

async function processSite(browser, site, payload) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();
  console.log(`\n──── ${site.label} ────`);
  console.log(`→ ${site.submitUrl}`);

  try {
    await page.goto(site.submitUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(1200);

    const filled = await autofillPage(page, payload);
    console.log(`✓ Pre-rellenado ${filled} campo(s).`);

    if (site.needsCaptcha) {
      console.log('⚠️  Este site tiene captcha. Resuélvelo manualmente.');
    }
    if (DRY_RUN) {
      console.log('(DRY_RUN) Skipping submit.');
    } else {
      const answer = await ask(
        'Revisa el formulario, ajusta campos y/o resuelve captcha. Pulsa [Enter] cuando hayas enviado y veas confirmación. Escribe "skip" para saltar este site: '
      );
      if (answer.toLowerCase() === 'skip') {
        console.log('⏭  Skipped.');
        return { id: site.id, status: 'skipped' };
      }
    }
    return { id: site.id, status: 'done', filled };
  } catch (err) {
    console.error('✗ Error:', err.message);
    return { id: site.id, status: 'error', error: err.message };
  } finally {
    if (!HEADED) await context.close();
  }
}

async function main() {
  const [{ sites }, payload] = await Promise.all([
    loadJSON('directories.json'),
    loadJSON('payload.json'),
  ]);
  const progress = await loadProgress();

  const queue = sites.filter((s) => !ONLY.length || ONLY.includes(s.id));
  console.log(`\nPlanazos BCN submitter`);
  console.log(`Sites en cola: ${queue.length}${ONLY.length ? ` (filtrados por ONLY)` : ''}`);
  console.log(`Modo: ${HEADED ? 'HEADED' : 'headless'}${DRY_RUN ? ' + DRY_RUN' : ''}`);
  console.log('');

  const browser = await chromium.launch({ headless: !HEADED });
  const results = [];

  for (const site of queue) {
    if (progress[site.id]?.status === 'done') {
      const reuse = (await ask(`"${site.label}" ya marcado como done. ¿Repetir? [y/N] `)).toLowerCase();
      if (reuse !== 'y') {
        console.log('⏭  Saltando.');
        continue;
      }
    }
    const res = await processSite(browser, site, payload);
    results.push(res);
    progress[site.id] = {
      ...res,
      at: new Date().toISOString(),
    };
    await saveProgress(progress);
  }

  await browser.close();
  rl.close();

  console.log('\n═══════════════════════════════');
  console.log('Resumen:');
  for (const r of results) {
    console.log(`  ${r.status === 'done' ? '✓' : r.status === 'skipped' ? '⏭' : '✗'} ${r.id} (${r.status})`);
  }
  console.log(`Progreso guardado en ${path.basename(PROGRESS_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
