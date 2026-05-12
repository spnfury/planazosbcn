'use client';

import { useMemo, useState } from 'react';
import { COPY_SHORT, COPY_LONG, TITLE, TAGS } from '@/data/promoKit';
import styles from './AutofillBookmarklet.module.css';

/**
 * Generates an autofill bookmarklet. When clicked on any page, the bookmarklet
 * scans inputs/textareas/selects and fills them based on field name, id,
 * placeholder or surrounding label. Best-effort: works on ~70-80% of common
 * directory submission forms without per-site selectors.
 */
function buildBookmarkletCode({ title, descShort, descLong, tags, groupUrl, webUrl }) {
  // Note: must be a single-line, encoded URL. Keep code compact and dependency-free.
  const data = {
    title,
    descShort,
    descLong,
    tags,
    groupUrl,
    webUrl,
  };

  const fnSource = `
    (function() {
      var DATA = __DATA__;
      var byKey = {
        title: ['title','name','nombre','titulo','heading'],
        desc: ['desc','description','descripcion','about','bio','summary','content','body'],
        url: ['url','link','website','web','site','enlace'],
        tags: ['tag','tags','keyword','keywords','etiqueta','etiquetas'],
        wa: ['whatsapp','wa']
      };
      function classify(el) {
        var blob = [
          el.name||'', el.id||'', el.placeholder||'', el.getAttribute('aria-label')||''
        ].join(' ').toLowerCase();
        var lab = '';
        if (el.labels && el.labels.length) {
          for (var i=0; i<el.labels.length; i++) lab += ' ' + (el.labels[i].textContent||'');
        }
        var parent = el.closest('label, .field, .form-group, .form-row, fieldset');
        if (parent) lab += ' ' + (parent.textContent||'').slice(0, 120);
        blob += ' ' + lab.toLowerCase();
        function has(list) { return list.some(function(w){ return blob.indexOf(w) !== -1; }); }
        if (has(byKey.wa)) return 'wa';
        if (has(byKey.url)) return 'url';
        if (has(byKey.tags)) return 'tags';
        if (has(byKey.title)) return 'title';
        if (has(byKey.desc)) return 'desc';
        return null;
      }
      function set(el, value) {
        var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        var setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        setter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.style.outline = '2px solid #25D366';
        setTimeout(function(){ el.style.outline=''; }, 1500);
      }
      var fields = document.querySelectorAll('input[type=text], input[type=url], input[type=search], input:not([type]), textarea');
      var filled = 0;
      fields.forEach(function(el){
        if (el.disabled || el.readOnly || el.value) return;
        var kind = classify(el);
        if (!kind) return;
        var value = null;
        if (kind === 'wa') value = DATA.groupUrl;
        else if (kind === 'url') value = DATA.webUrl;
        else if (kind === 'tags') value = DATA.tags;
        else if (kind === 'title') value = DATA.title;
        else if (kind === 'desc') {
          var max = el.maxLength && el.maxLength > 0 ? el.maxLength : 9999;
          value = max < 220 ? DATA.descShort : DATA.descLong;
        }
        if (value) { set(el, value); filled++; }
      });
      // Toast
      var t = document.createElement('div');
      t.textContent = '✓ Planazos autofill: ' + filled + ' campo' + (filled===1?'':'s');
      t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#128C7E;color:#fff;padding:14px 18px;border-radius:12px;font:600 14px system-ui;box-shadow:0 10px 30px rgba(0,0,0,.25);z-index:2147483647';
      document.body.appendChild(t);
      setTimeout(function(){ t.remove(); }, 2500);
    })();
  `;

  const compact = fnSource.replace(/\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const withData = compact.replace('__DATA__', JSON.stringify(data));
  return `javascript:${encodeURIComponent(withData)}`;
}

export default function AutofillBookmarklet() {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  // Read window.location.origin client-side
  if (typeof window !== 'undefined' && !origin) {
    setOrigin(window.location.origin);
  }

  const href = useMemo(() => {
    const webUrl = origin || 'https://planazosbcn.com';
    const groupUrl =
      process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL ||
      'https://chat.whatsapp.com/GDiYK6fC7OhHbAu2XipW9z';
    return buildBookmarkletCode({
      title: TITLE,
      descShort: COPY_SHORT,
      descLong: COPY_LONG,
      tags: TAGS,
      groupUrl,
      webUrl,
    });
  }, [origin]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>🔖 Bookmarklet de autofill</h2>
      <p className={styles.subtitle}>
        Arrastra el botón verde a tu barra de marcadores. Cuando estés en un formulario de
        cualquier directorio, click → rellena título / descripción / URL / tags / link de
        WhatsApp en los campos que detecte. Funciona en la mayoría de sites sin configuración.
      </p>

      <div className={styles.actions}>
        <a
          href={href}
          className={styles.dragBtn}
          draggable
          onClick={(e) => e.preventDefault()}
          title="Arrastra este botón a la barra de marcadores"
        >
          📣 Autofill Planazos
        </a>
        <button type="button" className={styles.copyBtn} onClick={handleCopy}>
          {copied ? '✓ Copiado' : 'Copiar código'}
        </button>
      </div>

      <details className={styles.help}>
        <summary>Cómo instalarlo</summary>
        <ol>
          <li>Activa la barra de marcadores en tu navegador (Ctrl/Cmd + Mayús + B).</li>
          <li>Arrastra el botón verde &quot;Autofill Planazos&quot; a esa barra.</li>
          <li>Cuando entres a un directorio (whatsgrouplinks, groupslor, etc.) y abras el formulario, clica el marcador.</li>
          <li>Verás un toast verde con los campos rellenados. Revisa, ajusta lo que el bookmarklet no haya cogido, y envía.</li>
        </ol>
        <p className={styles.note}>
          <strong>Si la web bloquea bookmarklets</strong> (algunos directorios tienen CSP estricto): copia el código y pégalo en la consola DevTools (F12 → Console). Mismo efecto.
        </p>
      </details>
    </div>
  );
}
