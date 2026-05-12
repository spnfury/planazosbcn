# Planazos BCN — Directory Submitter

Script semi-automatizado para dar de alta el grupo de WhatsApp de PlanazosBCN
en directorios públicos.

## Qué hace

1. Abre cada directorio en Chromium.
2. Detecta los campos del formulario (título, descripción, URL, tags, etc.)
   por heurística de nombres/labels y los pre-rellena.
3. Te pausa para que resuelvas captcha y/o ajustes campos.
4. Tú pulsas Enter cuando hayas enviado y vayas al siguiente.
5. Guarda progreso en `progress.json` (sites ya completados se saltan).

**No es totalmente automático**. Los directorios usan captchas, formularios
inusuales, y a veces requieren cuenta. El script asume el 80% del trabajo
mecánico; tú resuelves el 20% que requiere humano.

## Instalación

```bash
cd scripts/submit-directories
npm install
npm run install:browsers   # baja Chromium (solo primera vez)
```

## Uso

```bash
# Recomendado primera vez: con UI visible
npm run run:headed

# Solo prueba (no envía nada, solo navega y autofill)
npm run run:dry

# Headless después de que confíes en él
npm run run

# Solo directorios concretos:
ONLY=whatsgrouplinks,groupslor npm run run:headed
```

## Flujo de uso típico

1. `npm run run:headed`
2. El script abre el primer site → navega al formulario → rellena lo que detecta.
3. Tú miras: ¿faltó algún campo? Lo añades manualmente.
4. ¿Captcha? Lo resuelves.
5. Click "Submit". Esperas confirmación.
6. Vuelves a la terminal y pulsas Enter.
7. Pasa al siguiente.

## Ajustar payload

Edita `payload.json`. Cambia título, descripciones, links, etc.
Se reusa el contenido del Promo Kit del admin.

## Añadir más directorios

Edita `directories.json` añadiendo objetos:

```json
{
  "id": "ejemplo",
  "label": "ejemplo.com",
  "submitUrl": "https://ejemplo.com/submit",
  "needsCaptcha": true,
  "selectors": {}
}
```

El array `selectors` se puede ignorar — el autofill genérico funciona en la
mayoría de sites. Solo si un site concreto tiene HTML raro y el autofill no lo
detecta, puedes meter selectores específicos (lo añadiremos en una iteración
futura si hace falta).

## Limitaciones honestas

- **No resuelve captchas**: necesita supervisión humana.
- **No crea cuentas**: si un directorio pide registro, hazlo a mano y guarda
  credenciales en un password manager.
- **El HTML cambia**: si un directorio rediseña el formulario, el autofill
  puede fallar. Reportar y ajustar.
- **WhatsApp puede marcar el link como spam** si haces 30 submissions en 1
  día. Mejor 5-7 al día durante una semana.

## Recordatorios

- Antes de cada ejecución, mira `progress.json` para ver qué ya hiciste.
- Los directorios premium (con tráfico real) están en `tier: top` en
  `src/data/promoKit.js`. Empieza por esos.
