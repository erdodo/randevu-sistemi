import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";

// Yalnızca bu işletmeden randevu almış müşteriler listelenir
export async function GET() {
  try {
    const auth = await requireBusiness();
    if (auth.error) return auth.error;
    const businessId = auth.business.id;

    const appts = await prisma.appointment.findMany({
      where: { businessId },
      select: { customerPhone: true, customerName: true, date: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const byPhone = new Map<string, { id: string; phone: string; name: string; createdAt: Date; appointmentCount: number; lastAppointmentDate: string | null }>();
    for (const a of appts) {
      const c = byPhone.get(a.customerPhone);
      if (c) {
        c.appointmentCount++;
        c.createdAt = a.createdAt; // en eski randevu = ilk geliş
      } else {
        byPhone.set(a.customerPhone, {
          id: a.customerPhone,
          phone: a.customerPhone,
          name: a.customerName,
          createdAt: a.createdAt,
          appointmentCount: 1,
          lastAppointmentDate: a.date,
        });
      }
    }

    return NextResponse.json([...byPhone.values()]);
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
