import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const password = String(body?.password ?? "").trim();

    if (!password) {
      return NextResponse.json({ error: "Şifre gerekli" }, { status: 400 });
    }

    const business = await prisma.business.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!business) {
      return NextResponse.json({ error: "Silinecek şirket bulunamadı" }, { status: 404 });
    }

    if (password !== business.adminPassword) {
      return NextResponse.json({ error: "Şifre hatalı" }, { status: 401 });
    }

    await prisma.$transaction([
      prisma.notification.deleteMany(),
      prisma.appointment.deleteMany(),
      prisma.service.deleteMany(),
      prisma.webhook.deleteMany(),
      prisma.customer.deleteMany(),
      prisma.business.deleteMany(),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Veriler silinemedi" }, { status: 500 });
  }
}
