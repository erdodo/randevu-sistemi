import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const businesses = await prisma.business.findMany({
      include: { services: { where: { isActive: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(businesses);
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const business = await prisma.business.create({
      data: {
        name: body.name,
        slug: body.slug,
        sector: body.sector,
        logo: body.logo ?? null,
        primaryColor: body.primaryColor ?? "#6366f1",
        accentColor: body.accentColor ?? "#a5b4fc",
        description: body.description ?? null,
        address: body.address ?? null,
        phone: body.phone ?? null,
        adminPassword: body.adminPassword ?? "admin123",
        workingDays: body.workingDays ?? "1,2,3,4,5,6",
        openTime: body.openTime ?? "09:00",
        closeTime: body.closeTime ?? "18:00",
        slotDuration: body.slotDuration ?? 30,
      },
    });

    if (body.services?.length) {
      await prisma.service.createMany({
        data: body.services.map((s: { name: string; duration?: number; price?: number }) => ({
          businessId: business.id,
          name: s.name,
          duration: s.duration ?? 30,
          price: s.price ?? null,
        })),
      });
    }

    return NextResponse.json(business, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "İşletme oluşturulamadı" }, { status: 500 });
  }
}
