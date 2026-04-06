import puppeteer from 'puppeteer-core';
import supabase from './db.js';

// --- CONFIGURACIÓN ---
const CAMPAIGN_NAME = 'Matinée Gold VIP';

const SPINTAX_GREETINGS = [
  '¡Hola!',
  '¡Buenas!',
  '¡Qué tal!',
  'Hey!',
];

const SPINTAX_INTRO = [
  'He visto que sigues a Matinée',
  'Veo que te gusta el Matinée',
  'Como sigues a Matinée',
];

const SPINTAX_BODY = [
  'Tenemos una mesa VIP disponible para este evento y la estamos compartiendo.',
  'Hemos abierto una mesa VIP compartida para el evento de este finde.',
  'Quedan plazas en la mesa VIP que hemos organizado para la próxima fiesta.',
];

const SPINTAX_CTA = [
  '¿Te animas? Échale un ojo aquí',
  'Si te interesa, puedes reservarla aquí',
  'Míralo aquí si te apetece',
];

const LINK = 'https://planazosbcn.com/planes/matinee-gold-el-regreso-mas-esperado?utm_source=ig_dm&utm_medium=social&utm_campaign=matinee_vip';

function getRandomMessage() {
  const g = SPINTAX_GREETINGS[Math.floor(Math.random() * SPINTAX_GREETINGS.length)];
  const i = SPINTAX_INTRO[Math.floor(Math.random() * SPINTAX_INTRO.length)];
  const b = SPINTAX_BODY[Math.floor(Math.random() * SPINTAX_BODY.length)];
  const c = SPINTAX_CTA[Math.floor(Math.random() * SPINTAX_CTA.length)];

  return `${g} ${i}. 🎉 ${b} ${c}: ${LINK}`;
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retraso aleatorio simulando humanos (entre 3 y 6 minutos para evitar bans)
async function humanDelay() {
  const ms = Math.floor(Math.random() * (360000 - 180000 + 1)) + 180000;
  console.log(`⏱  Esperando ${Math.floor(ms/1000/60)} minutos y ${(ms/1000)%60} segundos antes del siguiente...`);
  await delay(ms);
}

// Retraso para teclear y hacer clics (2-5 segundos)
async function smallDelay() {
  const ms = Math.floor(Math.random() * 3000) + 2000;
  await delay(ms);
}

async function run() {
  let browser;
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    browser = await puppeteer.connect({
      browserWSEndpoint: data.webSocketDebuggerUrl,
      defaultViewport: null
    });
    console.log('✅ Conectado a Chrome local para envío de mensajes!');
  } catch (error) {
    console.error('❌ NO SE PUDO CONECTAR A CHROME (puerto 9222).');
    return;
  }

  // 1. Obtener campaña
  const { data: campaign } = await supabase
    .from('outreach_campaigns')
    .select('id')
    .eq('name', CAMPAIGN_NAME)
    .single();

  if (!campaign) {
    console.error('❌ No se encontró la campaña. Ejecuta el scraper primero.');
    if(browser) browser.disconnect();
    return;
  }

  // 2. Obtener leads pendientes
  const { data: leads, error } = await supabase
    .from('outreach_leads')
    .select('*')
    .eq('campaign_id', campaign.id)
    .eq('status', 'pending')
    .limit(30); // LIMITE DIARIO DE 30 MENSAJES PARA EVITAR BANEO

  if (error || !leads || leads.length === 0) {
    console.log('🎉 No hay leads pendientes para esta campaña. (O el límite diario ya se ha alcanzado y debes seguir mañana).');
    if(browser) browser.disconnect();
    return;
  }

  console.log(`🚀 Vamos a enviar mensajes a ${leads.length} usuarios hoy para proteger tu cuenta...`);

  const page = await browser.newPage();
  
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    console.log(`\n▶️ [${i+1}/${leads.length}] Kontaktando a @${lead.username}...`);

    try {
      // Navegar a la página de mensajería directa
      await page.goto(`https://www.instagram.com/direct/new/`, { waitUntil: 'load' });
      await delay(4000); // Wait for the modal / UI to settle

      // --- Flujo de Instagram Direct ---
      // 1. Escribir nombre en la barra de búsqueda
      // El aria-label de input de buscar puede variar, solemos buscar por 'input[name="queryBox"]' o placeholder
      const searchInputSelector = "input[placeholder*='Busca'], input[placeholder*='Search']";
      await page.waitForSelector(searchInputSelector);
      await page.type(searchInputSelector, lead.username, { delay: 150 });
      await smallDelay();

      // 2. Seleccionar el primer usuario de la lista que coincida (suele ser el primero)
      // Buscamos algo listado con su nombre
      const userItemSelector = `div[role="button"]`;
      await page.evaluate((uname) => {
        const divs = Array.from(document.querySelectorAll('span, div'));
        const target = divs.find(d => d.textContent.trim().toLowerCase() === uname.toLowerCase());
        if(target) {
            // Find parent button
            let parent = target.parentElement;
            while(parent && parent.getAttribute('role') !== 'button') {
                parent = parent.parentElement;
            }
            if(parent) parent.click();
        }
      }, lead.username);
      
      await smallDelay();

      // 3. Darle al botón de "Chat" o "Next"
      const nextBtnSelector = `div[role="button"]`;
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('div[role="button"]'));
        const next = btns.find(b => b.textContent.includes('Chat') || b.textContent.includes('Siguiente') || b.textContent.includes('Next'));
        if(next) next.click();
      });

      await delay(6000); // Esperar a que se abra la ventana del chat

      // 4. Buscar el textarea o 'Message...'
      const msgBoxSelector = `div[role="textbox"]`;
      const msgBoxExists = await page.$(msgBoxSelector);
      
      if (!msgBoxExists) {
        throw new Error('No se ha podido acceder a la caja de texto. (Bloqueo o layout cambiado)');
      }

      const exactMessage = getRandomMessage();
      console.log(`Escribiendo mensaje: "${exactMessage}"`);
      
      await page.type(msgBoxSelector, exactMessage, { delay: 45 });
      await smallDelay();

      // 5. Pulsar enviar
      // Usaremos Press Enter
      await page.keyboard.press('Enter');

      console.log(`✅ Mensaje enviado a @${lead.username}!`);
      
      // 6. Actualizar Supabase
      await supabase
        .from('outreach_leads')
        .update({ status: 'sent', sent_at: new Date() })
        .eq('id', lead.id);

      if (i < leads.length - 1) {
        await humanDelay(); // Proteger cuenta!
      }

    } catch(err) {
      console.error(`❌ Error enviando a ${lead.username}:`, err.message);
      await supabase
        .from('outreach_leads')
        .update({ status: 'failed', notes: err.message })
        .eq('id', lead.id);
      
      // Pause briefly after failure
      await delay(5000);
    }
  }

  console.log('✅ Finalizado el envío diario!');
  await page.close();
  if(browser) browser.disconnect();
}

run();
