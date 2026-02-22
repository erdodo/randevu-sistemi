#!/bin/sh
set -e

echo "🔄 Veritabanı tabloları oluşturuluyor..."
node node_modules/prisma/build/index.js db push --skip-generate 2>/dev/null || {
  echo "⏳ PostgreSQL'e bağlanılamadı, 5 saniye bekleniyor..."
  sleep 5
  node node_modules/prisma/build/index.js db push --skip-generate
}
echo "✅ Veritabanı hazır!"

echo "🚀 Uygulama başlatılıyor..."
exec node server.js
