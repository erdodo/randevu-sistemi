#!/bin/sh
set -e

echo "🔄 Veritabanı tabloları oluşturuluyor..."
npx prisma db push --skip-generate 2>/dev/null || {
  echo "⏳ PostgreSQL'e bağlanılamadı, 5 saniye bekleniyor..."
  sleep 5
  npx prisma db push --skip-generate
}
echo "✅ Veritabanı hazır!"

echo "🚀 Uygulama başlatılıyor..."
exec node server.js
