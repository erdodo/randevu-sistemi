import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerWebhooks } from "@/lib/webhooks";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const slug = searchParams.get("slug");
    const date = searchParams.get("date");
    const month = searchParams.get("month"); // "2026-02"
    const status = searchParams.get("status");

    let business = null;
    if (slug) {
      business = await prisma.business.findUnique({ where: { slug } });
      if (!business) return NextResponse.json({ error: "İşletme bulunamadı" }, { status: 404 });
    }

    const where: Record<string, unknown> = {};
    if (businessId) where.businessId = businessId;
    if (business) where.businessId = business.id;
    if (date) where.date = date;
    if (month) {
      const [y, m] = month.split("-").map(Number);
      const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
      where.date = { gte: `${month}-01`, lt: `${next}-01` };
    }
    if (status) where.status = status;

    const appointments = await prisma.appointment.findMany({
      where,
      include: { service: true },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    return NextResponse.json(appointments);
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const business = await prisma.business.findUnique({ where: { id: body.businessId } });
    if (!business) return NextResponse.json({ error: "İşletme bulunamadı" }, { status: 404 });

    const conflict = await prisma.appointment.findFirst({
      where: {
        businessId: body.businessId,
        date: body.date,
        time: body.time,
        status: { in: ["pending", "approved"] },
      },
    });
    if (conflict) return NextResponse.json({ error: "Bu saat dolu" }, { status: 409 });

    const appointment = await prisma.appointment.create({
      data: {
        businessId: body.businessId,
        serviceId: body.serviceId ?? null,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        date: body.date,
        time: body.time,
        notes: body.notes ?? null,
        status: "pending",
      },
      include: { service: true },
    });

    // Upsert customer record
    await prisma.customer.upsert({
      where: { phone: body.customerPhone },
      update: { name: body.customerName },
      create: { phone: body.customerPhone, name: body.customerName },
    });

    await prisma.notification.create({
      data: {
        businessId: body.businessId,
        appointmentId: appointment.id,
        message: `Yeni randevu: ${body.customerName} — ${body.date} ${body.time}`,
        type: "new_appointment",
      },
    });

    // Trigger webhooks
    triggerWebhooks("appointment_created", appointment);

    return NextResponse.json(appointment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Randevu oluşturulamadı" }, { status: 500 });
  }
}
