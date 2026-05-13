#!/bin/bash
# Wrapper semanal para outreach PlanazosBCN — llamado por crontab
# Logs en: logs/outreach/YYYY-MM-DD_HH-MM.log

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs/outreach"
LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d_%H-%M).log"

mkdir -p "$LOG_DIR"

log() { echo "$1" | tee -a "$LOG_FILE"; }

log "=== Outreach semanal $(date) ==="
log "Proyecto: $PROJECT_DIR"

# Cargar nvm si existe (cron no tiene el PATH del shell interactivo)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Verificar que node existe
if ! command -v node &> /dev/null; then
  log "❌ node no encontrado — añade node al PATH del cron o usa nvm"
  exit 1
fi

log "Node: $(node --version)"

# Detectar Chrome en puerto 9222
CHROME_OK=false
if curl -s --max-time 2 http://127.0.0.1:9222/json/version > /dev/null 2>&1; then
  CHROME_OK=true
  log "✅ Chrome detectado (puerto 9222)"
else
  log "⚠️  Chrome NO disponible — WA Directories y Facebook se saltarán"
  log "   Para activarlos: abre Chrome con --remote-debugging-port=9222"
fi

cd "$PROJECT_DIR"

# Reddit (API pura, no necesita Chrome)
log ""
log "▶ [1/3] Reddit..."
node scripts/outreach/reddit-poster.js 2>&1 | tee -a "$LOG_FILE"

if [ "$CHROME_OK" = true ]; then
  log ""
  log "▶ [2/3] WA Directories..."
  node scripts/outreach/wa-directories.js 2>&1 | tee -a "$LOG_FILE"

  log ""
  log "▶ [3/3] Facebook grupos..."
  node scripts/outreach/facebook-poster.js 2>&1 | tee -a "$LOG_FILE"
else
  log ""
  log "⏭  [2/3] WA Directories — Chrome no disponible, saltado"
  log "⏭  [3/3] Facebook grupos  — Chrome no disponible, saltado"
fi

log ""
log "=== Completado $(date) ==="

# Borrar logs de más de 90 días
find "$LOG_DIR" -name "*.log" -mtime +90 -delete 2>/dev/null
