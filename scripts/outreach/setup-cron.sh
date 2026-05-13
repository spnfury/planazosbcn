#!/bin/bash
# Instala crontab semanal para outreach PlanazosBCN
# Ejecutar UNA vez: bash scripts/outreach/setup-cron.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEEKLY="$SCRIPT_DIR/run-weekly.sh"

chmod +x "$WEEKLY"

# Lunes 10:00 — ajusta el horario si quieres otro día/hora
# Formato: MIN HORA DIA_MES MES DIA_SEMANA
CRON_ENTRY="0 10 * * 1 $WEEKLY"

if crontab -l 2>/dev/null | grep -qF "run-weekly.sh"; then
  echo "⚠️  Ya existe entrada crontab:"
  crontab -l | grep "run-weekly.sh"
  echo ""
  echo "Para cambiar horario: crontab -e"
  exit 0
fi

# Añadir al crontab existente
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "✅ Cron instalado. Ejecutará cada lunes a las 10:00."
echo ""
echo "Entrada añadida:"
echo "  $CRON_ENTRY"
echo ""
echo "Verificar:  crontab -l"
echo "Editar:     crontab -e"
echo "Logs en:    $(cd "$SCRIPT_DIR/../.." && pwd)/logs/outreach/"
echo ""
echo "IMPORTANTE — Para que WA Directories y Facebook funcionen en el cron,"
echo "Chrome debe estar abierto con remote debugging:"
echo "  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\"
echo "    --remote-debugging-port=9222 --profile-directory=Default"
