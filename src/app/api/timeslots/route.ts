import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTimeSlots, isWorkingDay } from "@/lib/timeSlots";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const date = searchParams.get("date");

    if (!slug || !date) {
      return NextResponse.json({ error: "slug ve date gerekli" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) return NextResponse.json({ error: "İşletme bulunamadı" }, { status: 404 });

    if (!isWorkingDay(date, business.workingDays)) {
      return NextResponse.json({ slots: [], message: "Bu gün çalışma günü değil" });
    }

    const booked = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        date,
        status: { in: ["pending", "approved"] },
      },
      select: { time: true },
    });

    const bookedTimes = booked.map((a: (typeof booked)[number]) => a.time);
    const slots = generateTimeSlots(business.openTime, business.closeTime, business.slotDuration, bookedTimes);

    return NextResponse.json({ slots });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
