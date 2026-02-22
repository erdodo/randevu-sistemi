import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerWebhooks } from "@/lib/webhooks";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true, business: true },
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
    const { id } = await params;
    const body = await req.json();

    const appointment = await prisma.appointment.findUnique({ where: { id } });
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
      triggerWebhooks("appointment_approved", updated);
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
    const { id } = await params;
    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Silme başarısız" }, { status: 500 });
  }
}
