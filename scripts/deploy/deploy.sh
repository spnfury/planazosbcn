#!/bin/bash
# Deploy de PlanazosBCN en el VPS
# Ejecutar desde el VPS:
#   bash /var/www/planazosbcn/scripts/deploy/deploy.sh

set -e

APP_DIR="/var/www/planazosbcn"

echo "▶ Actualizando código..."
cd $APP_DIR
git pull origin master

echo "▶ Instalando dependencias..."
npm install --legacy-peer-deps --prefer-offline

echo "▶ Compilando..."
npm run build

echo "▶ Reiniciando app..."
pm2 restart planazosbcn

echo "✅ Deploy completado — $(date)"
pm2 status planazosbcn
