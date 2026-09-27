import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerWebhooks } from "@/lib/webhooks";
import { getSession } from "@/lib/session";
import { isTenantReadOnly } from "@/lib/campaign";

const digits = (s: string) => s.replace(/\D/g, "");

// Yönetici: kendi işletmesinin tüm randevuları.
// Müşteri: yalnızca ?phone= ile verdiği numaraya ait randevular (başkalarının adı/telefonu görünmez).
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const date = searchParams.get("date");
    const month = searchParams.get("month"); // "2026-02"
    const status = searchParams.get("status");
    const phone = searchParams.get("phone");

    if (!slug) return NextResponse.json({ error: "slug gerekli" }, { status: 400 });
    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) return NextResponse.json({ error: "İşletme bulunamadı" }, { status: 404 });

    const session = await getSession();
    const isOwner = session?.businessId === business.id;
    if (!isOwner && !phone) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const where: Record<string, unknown> = { businessId: business.id };
    if (date) where.date = date;
    if (month) {
      const [y, m] = month.split("-").map(Number);
      const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
      where.date = { gte: `${month}-01`, lt: `${next}-01` };
    }
    if (status) where.status = status;

    let appointments = await prisma.appointment.findMany({
      where,
      include: { service: true },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });
    if (!isOwner) {
      const p = digits(phone!);
      appointments = appointments.filter((a) => digits(a.customerPhone) === p);
    }

    return NextResponse.json(appointments);
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.customerName?.trim() || !body.customerPhone?.trim() || !body.date || !body.time) {
      return NextResponse.json({ error: "İsim, telefon, tarih ve saat gerekli" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { id: body.businessId } });
    if (!business) return NextResponse.json({ error: "İşletme bulunamadı" }, { status: 404 });
    if (isTenantReadOnly(business.slug)) {
      return NextResponse.json({ error: "Bu işletme şu anda online randevu almıyor." }, { status: 402 });
    }

    if (body.serviceId) {
      const service = await prisma.service.findFirst({ where: { id: body.serviceId, businessId: business.id }, select: { id: true } });
      if (!service) return NextResponse.json({ error: "Hizmet bulunamadı" }, { status: 400 });
    }

    const conflict = await prisma.appointment.findFirst({
      where: {
        businessId: business.id,
        date: body.date,
        time: body.time,
        status: { in: ["pending", "approved"] },
      },
    });
    if (conflict) return NextResponse.json({ error: "Bu saat dolu" }, { status: 409 });

    const appointment = await prisma.appointment.create({
      data: {
        businessId: business.id,
        serviceId: body.serviceId ?? null,
        customerName: body.customerName.trim(),
        customerPhone: body.customerPhone.trim(),
        date: body.date,
        time: body.time,
        notes: body.notes ?? null,
        status: "pending",
      },
      include: { service: true },
    });

    // Upsert customer record
    await prisma.customer.upsert({
      where: { phone: appointment.customerPhone },
      update: { name: appointment.customerName },
      create: { phone: appointment.customerPhone, name: appointment.customerName },
    });

    await prisma.notification.create({
      data: {
        businessId: business.id,
        appointmentId: appointment.id,
        message: `Yeni randevu: ${appointment.customerName} — ${appointment.date} ${appointment.time}`,
        type: "new_appointment",
      },
    });

    // Trigger webhooks
    triggerWebhooks(business.id, "appointment_created", appointment);

    return NextResponse.json(appointment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Randevu oluşturulamadı" }, { status: 500 });
  }
}
