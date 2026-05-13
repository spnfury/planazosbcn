#!/bin/bash
# Setup inicial del VPS para PlanazosBCN
# Ejecutar UNA sola vez como root en el VPS:
#   bash setup-vps.sh
#
# Necesitas tener .env.local listo para pegar cuando el script lo pida.

set -e

APP_DIR="/var/www/planazosbcn"
DOMAIN="planazosbcn.com"
REPO="https://github.com/spnfury/planazosbcn.git"
NODE_VERSION="22"

echo "================================================"
echo "  PlanazosBCN — Setup VPS"
echo "  Dominio: $DOMAIN"
echo "  Directorio: $APP_DIR"
echo "================================================"
echo ""

# ── 1. Sistema ──────────────────────────────────────
echo "▶ [1/7] Actualizando sistema..."
apt-get update -qq
apt-get install -y -qq curl git nginx certbot python3-certbot-nginx ufw

# ── 2. Node.js 22 ───────────────────────────────────
echo "▶ [2/7] Instalando Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y -qq nodejs
echo "   Node: $(node --version) | npm: $(npm --version)"

# ── 3. PM2 ──────────────────────────────────────────
echo "▶ [3/7] Instalando PM2..."
npm install -g pm2 --quiet
echo "   PM2: $(pm2 --version)"

# ── 4. Clonar repo ──────────────────────────────────
echo "▶ [4/7] Clonando repositorio..."
mkdir -p $APP_DIR
git clone $REPO $APP_DIR
cd $APP_DIR

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ACCIÓN REQUERIDA: pega el contenido de tu"
echo "  .env.local y presiona Ctrl+D cuando acabes."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat > $APP_DIR/.env.local
chmod 600 $APP_DIR/.env.local
echo "   .env.local guardado."

# ── 5. Build ─────────────────────────────────────────
echo ""
echo "▶ [5/7] Instalando dependencias y compilando..."
cd $APP_DIR
npm install --legacy-peer-deps
npm run build

# ── 6. PM2 ───────────────────────────────────────────
echo "▶ [6/7] Configurando PM2..."
pm2 start $APP_DIR/ecosystem.config.cjs
pm2 startup systemd -u root --hp /root | tail -1 | bash
pm2 save
echo "   App corriendo en puerto 3000"

# ── 7. Nginx ─────────────────────────────────────────
echo "▶ [7/7] Configurando Nginx..."
cp $APP_DIR/scripts/deploy/nginx.conf /etc/nginx/sites-available/planazosbcn
ln -sf /etc/nginx/sites-available/planazosbcn /etc/nginx/sites-enabled/planazosbcn
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Nginx activo. Ahora apunta el DNS:"
echo "    A    @              78.46.100.91"
echo "    A    www            78.46.100.91"
echo ""
echo "  Cuando el DNS propague, ejecuta:"
echo "    certbot --nginx -d planazosbcn.com -d www.planazosbcn.com"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Setup completado."
echo ""
echo "Comandos útiles:"
echo "  pm2 status              — ver estado"
echo "  pm2 logs planazosbcn    — ver logs"
echo "  pm2 restart planazosbcn — reiniciar app"
echo "  bash $APP_DIR/scripts/deploy/deploy.sh — actualizar"
