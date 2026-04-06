import puppeteer from 'puppeteer-core';
import supabase from './db.js';

// --- CONFIGURACIÓN ---
const CHROME_WS_ENDPOINT = 'ws://127.0.0.1:9222/devtools/browser/YOUR_WS_ENDPOINT_HERE';
// Reemplaza YOUR_WS_ENDPOINT_HERE. Puedes conseguirlo corriendo localmente:
// curl http://127.0.0.1:9222/json/version
// Si usas Mac, arranca Chrome con:
// /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

const TARGET_ACCOUNT = 'matineegroup';
const MAX_FOLLOWERS_TO_SCRAPE = 200; // Número de seguidores a extraer
const CAMPAIGN_NAME = 'Matinée Gold VIP';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('🚀 Iniciando scraper de seguidores conectándose a tu Chrome local...');
  let browser;
  try {
    // Si tienes problemas de conexión, asegúrate de haber arrancado Chrome con el flag --remote-debugging-port=9222
    // y copia el webSocketDebuggerUrl que te da en http://127.0.0.1:9222/json/version
    
    // Intento conectar directamente asumiendo que devtools está activo
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      const data = await res.json();
      browser = await puppeteer.connect({
        browserWSEndpoint: data.webSocketDebuggerUrl,
        defaultViewport: null
      });
      console.log('✅ Conectado exitosamente a Chrome!');
    } catch (e) {
      console.error('❌ NO SE PUDO CONECTAR A CHROME (puerto 9222).');
      console.log(`Por favor, arranca Chrome en tu Mac con el siguiente comando en otra terminal:\n /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 \n\nLuego vuelve a ejecutar este script.`);
      return;
    }

    // 1. Obtener/Crear Campaña en Supabase
    let { data: campaign } = await supabase
      .from('outreach_campaigns')
      .select('id')
      .eq('name', CAMPAIGN_NAME)
      .single();

    if (!campaign) {
      const { data: newCampaign, error } = await supabase
        .from('outreach_campaigns')
        .insert([{
          name: CAMPAIGN_NAME,
          target_account: TARGET_ACCOUNT,
          platform: 'instagram'
        }])
        .select()
        .single();
      
      if (error) throw error;
      campaign = newCampaign;
      console.log(`📝 Creada nueva campaña en base de datos: ${CAMPAIGN_NAME}`);
    } else {
      console.log(`✅ Usando campaña existente: ${CAMPAIGN_NAME} (ID: ${campaign.id})`);
    }

    const page = await browser.newPage();
    console.log(`Navegando a https://www.instagram.com/${TARGET_ACCOUNT}/ ...`);
    await page.goto(`https://www.instagram.com/${TARGET_ACCOUNT}/`, { waitUntil: 'networkidle2' });

    console.log('Esperando interacción humana si hay algún pop-up... 5 segundos');
    await delay(5000);

    // Click on "Followers" link
    console.log('Buscando enlace de seguidores...');
    const followersLinkSelector = `a[href="/${TARGET_ACCOUNT}/followers/"]`;
    await page.waitForSelector(followersLinkSelector);
    await page.click(followersLinkSelector);

    console.log('Esperando a que cargue el modal de seguidores...');
    await delay(3000);

    // Scroll and Scrape
    console.log(`Haciendo scroll hasta encontrar aprox ${MAX_FOLLOWERS_TO_SCRAPE} seguidores...`);
    const scrollBoxSelector = 'div[role="dialog"] div[style*="flex-direction: column"] > div > div:last-child > div'; // Very brittle, might need update based on IG DOM
    
    // Función inyectada en el navegador para hacer scroll
    const scrapedUsernames = new Set();
    
    let retries = 0;
    while (scrapedUsernames.size < MAX_FOLLOWERS_TO_SCRAPE && retries < 15) {
      const users = await page.evaluate(() => {
        const dialog = document.querySelector('div[role="dialog"]');
        if(!dialog) return [];
        // Buscar enlaces de perfiles que no contengan /p/ ni /reel/
        const links = Array.from(dialog.querySelectorAll('a[role="link"]'));
        const names = [];
        for (const a of links) {
          const href = a.getAttribute('href');
          if (href && href.startsWith('/') && !href.includes('/p/') && !href.includes('/reel/') && !href.includes('/explore/')) {
            const clean = href.replace(/\//g, '');
            if(clean) names.push(clean);
          }
        }
        
        // Intentar hacer scroll al contenedor
        const scrollableNode = dialog.querySelector('div[style*="overflow: hidden auto;"]');
        if (scrollableNode) {
          scrollableNode.scrollBy(0, 1000);
        } else {
            // fallback scroll
            const divs = dialog.querySelectorAll('div');
            for(let d=divs.length-1; d>=0; d--) {
                if(divs[d].scrollHeight > divs[d].clientHeight) {
                    divs[d].scrollBy(0, 1000);
                    break;
                }
            }
        }
        return names;
      });

      let oldSize = scrapedUsernames.size;
      users.forEach(u => scrapedUsernames.add(u));
      
      console.log(`Encontrados: ${scrapedUsernames.size} / ${MAX_FOLLOWERS_TO_SCRAPE}`);

      if (scrapedUsernames.size === oldSize) {
        retries++;
        console.log(`Atascado? Reintento ${retries}/15`);
      } else {
        retries = 0;
      }
      
      await delay(1500); // Dar tiempo a cargar imágenes
    }

    console.log(`🎉 Scraping finalizado. Encontrados ${scrapedUsernames.size} usuarios.`);
    
    // Guardar en base de datos
    console.log(`Guardando en Supabase...`);
    const leadsArr = Array.from(scrapedUsernames).map(username => ({
      campaign_id: campaign.id,
      username: username,
      profile_url: `https://instagram.com/${username}`
    }));

    // Inserción en lotes manejando duplicados (upsert)
    const { error } = await supabase
      .from('outreach_leads')
      .upsert(leadsArr, { onConflict: 'campaign_id,username', ignoreDuplicates: true });

    if (error) {
      console.error('Error insertando leads:', error);
    } else {
      console.log('✅ Leads insertados/actualizados correctamente en base de datos!');
    }

    await page.close();

  } catch (error) {
    console.error('❌ Error fatal en el scraper:', error);
  } finally {
    // Si queremos dejar el navegador tal cual está para no cerrárselo al usuario
    if(browser) browser.disconnect();
  }
}

run();
