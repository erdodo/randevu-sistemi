#!/bin/sh
set -e

MAX_RETRIES=10
RETRY=0

until node node_modules/prisma/build/index.js db push 2>&1; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "❌ Veritabanına bağlanılamadı, çıkılıyor."
    exit 1
  fi
  echo "⏳ PostgreSQL hazır değil, bekleniyor... ($RETRY/$MAX_RETRIES)"
  sleep 3
done

echo "✅ Veritabanı hazır!"
echo "🚀 Uygulama başlatılıyor..."
exec node server.js
