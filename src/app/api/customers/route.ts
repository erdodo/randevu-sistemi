import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const business = await prisma.business.findFirst();
    if (!business) {
      return NextResponse.json({ error: "Dükkan bulunamadı" }, { status: 404 });
    }

    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Enrich with appointment counts
    const enriched = await Promise.all(
      customers.map(async (c: (typeof customers)[number]) => {
        const appointmentCount = await prisma.appointment.count({
          where: { customerPhone: c.phone, businessId: business.id },
        });
        const lastAppointment = await prisma.appointment.findFirst({
          where: { customerPhone: c.phone, businessId: business.id },
          orderBy: { createdAt: "desc" },
        });
        return {
          ...c,
          appointmentCount,
          lastAppointmentDate: lastAppointment?.date ?? null,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
