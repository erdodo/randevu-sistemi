<div align="center">

# 📅 Randevu Sistemi

**Tek dükkan için modern, kurulumu kolay, Docker-ready randevu yönetim sistemi.**

Next.js 16 · PostgreSQL · Prisma 7 · Tailwind CSS v4

---

</div>

## 🚀 Hızlı Kurulum (Sunucu)

> Tek satır komutla Linux sunucuya (VPS, Raspberry Pi vb.) deploy edin.

```bash
curl -L https://github.com/erdodo/randevu-sistemi/archive/refs/heads/main.tar.gz | tar xz && cd randevu-sistemi-main && sudo docker compose up -d --build
```

Uygulama `http://SUNUCU_IP:3031` adresinde hazır olacaktır.

> **İlk açılışta kurulum sihirbazı** sizi karşılar — şablon seçin, bilgileri girin, şifre belirleyin. 30 saniyede çalışır durumda.

---

## 📋 Gereksinimler

| Bileşen        | Minimum |
| -------------- | ------- |
| Docker         | 20.10+  |
| Docker Compose | 2.0+    |
| RAM            | 512 MB  |
| Disk           | 500 MB  |

> **Node.js, PostgreSQL vb. ayrıca kurmanıza gerek yok.** Docker her şeyi kendi içinde çalıştırır.

---

## 🏗️ Mimari

```
┌──────────────────────────────────┐
│         Docker Compose           │
│                                  │
│  ┌────────────┐  ┌────────────┐  │
│  │  Next.js   │  │ PostgreSQL │  │
│  │  App       │──│  Database  │  │
│  │  :3031     │  │  :5432     │  │
│  └────────────┘  └────────────┘  │
│                                  │
└──────────────────────────────────┘
         ↑ Tek açık port
    http://IP:3031
```

- **Dışarıya sadece `:3031` portu açıktır.** PostgreSQL tamamen container içindedir.
- Veriler `randevu_data` Docker volume'unda kalıcı olarak saklanır.

---

## 🖥️ Geliştirme Ortamı

### Ön Koşullar

- Node.js 20+
- Docker (sadece PostgreSQL için)

### Kurulum

```bash
# Repo'yu klonla
git clone git@github.com:erdodo/randevu-sistemi.git
cd randevu-sistemi

# Bağımlılıkları kur
npm install

# PostgreSQL'i ayağa kaldır
docker compose up db -d

# .env dosyasını oluştur
echo 'DATABASE_URL="postgresql://randevu:randevu123@localhost:5432/randevu"' > .env

# Prisma client oluştur ve veritabanını hazırla
npx prisma generate
npx prisma db push

# Geliştirme sunucusunu başlat
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışır.

### Proje Yapısı

```
src/
├── app/
│   ├── admin/              # Admin paneli sayfası
│   ├── api/
│   │   ├── appointments/   # Randevu CRUD
│   │   ├── customers/      # Müşteri listesi
│   │   ├── notifications/  # Bildirim yönetimi
│   │   ├── setup/          # İlk kurulum
│   │   ├── timeslots/      # Müsait saatler
│   │   └── webhooks/       # Webhook CRUD
│   └── page.tsx            # Ana sayfa (kurulum/randevu)
├── components/
│   ├── admin/              # AdminClient, BrandingModal
│   ├── customer/           # BookingClient
│   ├── setup/              # SetupWizard
│   └── ui/                 # PwaInstallToast
├── lib/
│   ├── prisma.ts           # Prisma client (PrismaPg adapter)
│   ├── templates.ts        # Sektör şablonları
│   ├── webhooks.ts         # Webhook trigger utility
│   └── utils.ts            # Yardımcı fonksiyonlar
└── types/                  # TypeScript interface'leri
```

### Veritabanı Şemasını Güncelleme

```bash
# schema.prisma'yı düzenle, sonra:
npx prisma db push
npx prisma generate
```

### Üretim Build'i

```bash
npm run build
# Çıktı: .next/standalone (Docker'a hazır)
```

---

## ⚙️ Yapılandırma

### Port Değiştirme

`docker-compose.yml` dosyasında:

```yaml
ports:
  - "ISTEDIGINIZ_PORT:3000"
```

### Veritabanı Şifresi

`docker-compose.yml` dosyasındaki environment değişkenlerinden değiştirilebilir:

```yaml
POSTGRES_PASSWORD: yeni_sifre_123
DATABASE_URL: postgresql://randevu:yeni_sifre_123@db:5432/randevu
```

---

## 🔗 Webhook Sistemi

Randevu oluşturulduğunda veya onaylandığında harici API'lere bildirim gönderin.

### Event Tipleri

| Event                  | Tetiklenme Zamanı                   |
| ---------------------- | ----------------------------------- |
| `appointment_created`  | Müşteri yeni randevu oluşturduğunda |
| `appointment_approved` | Admin randevuyu onayladığında       |

### Payload Formatı

```json
{
  "event": "appointment_created",
  "timestamp": "2026-02-22T12:00:00.000Z",
  "data": {
    "id": "clx...",
    "customerName": "Ali Yılmaz",
    "customerPhone": "05551234567",
    "date": "2026-02-24",
    "time": "14:00",
    "status": "pending",
    "service": {
      "name": "Saç Kesimi",
      "duration": 30,
      "price": 150
    }
  }
}
```

### Güvenlik

Secret key tanımladığınızda, her istekte `X-Webhook-Secret` header'ı gönderilir.

---

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişiklikleri commit edin (`git commit -m 'feat: yeni özellik'`)
4. Push yapın (`git push origin feature/yeni-ozellik`)
5. Pull Request açın

---

## 📄 Lisans

MIT License — İstediğiniz gibi kullanın, değiştirin, dağıtın.
