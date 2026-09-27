import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerWebhooks } from "@/lib/webhooks";
import { requireBusiness, requireWritableBusiness } from "@/lib/session";

const STATUSES = ["pending", "approved", "cancelled", "completed"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireBusiness();
    if (auth.error) return auth.error;
    const { id } = await params;
    const appointment = await prisma.appointment.findFirst({
      where: { id, businessId: auth.business.id },
      include: { service: true },
    });
    if (!appointment) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    return NextResponse.json(appointment);
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireWritableBusiness();
    if (auth.error) return auth.error;
    const { id } = await params;
    const body = await req.json();
    if (body.status && !STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findFirst({ where: { id, businessId: auth.business.id } });
    if (!appointment) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: body.status ?? appointment.status },
      include: { service: true },
    });

    if (body.status && body.status !== appointment.status) {
      const messages: Record<string, string> = {
        approved: `Randevu onaylandı: ${appointment.customerName} - ${appointment.date} ${appointment.time}`,
        cancelled: `Randevu iptal edildi: ${appointment.customerName} - ${appointment.date} ${appointment.time}`,
        completed: `Randevu tamamlandı: ${appointment.customerName} - ${appointment.date} ${appointment.time}`,
      };
      if (messages[body.status]) {
        await prisma.notification.create({
          data: {
            businessId: appointment.businessId,
            appointmentId: id,
            message: messages[body.status],
            type: body.status,
          },
        });
      }
    }

    // Trigger webhook on approval
    if (body.status === "approved") {
      triggerWebhooks(auth.business.id, "appointment_approved", updated);
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireWritableBusiness();
    if (auth.error) return auth.error;
    const { id } = await params;
    const { count } = await prisma.appointment.deleteMany({ where: { id, businessId: auth.business.id } });
    if (!count) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Silme başarısız" }, { status: 500 });
  }
}
