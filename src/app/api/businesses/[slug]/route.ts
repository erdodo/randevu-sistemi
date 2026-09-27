import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, publicBusiness, requireWritableBusiness } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const business = await prisma.business.findUnique({
      where: { slug },
      include: { services: { where: { isActive: true } } },
    });
    if (!business) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    return NextResponse.json(publicBusiness(business));
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await requireWritableBusiness();
    if (auth.error) return auth.error;
    const { slug } = await params;
    const existing = auth.business;
    if (existing.slug !== slug) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });

    const body = await req.json();
    if (body.newPassword && String(body.newPassword).length < 6) {
      return NextResponse.json({ error: "Yeni şifre en az 6 karakter olmalı" }, { status: 400 });
    }

    const updated = await prisma.business.update({
      where: { id: existing.id },
      data: {
        name: body.name ?? existing.name,
        logo: body.logo !== undefined ? body.logo : existing.logo,
        primaryColor: body.primaryColor ?? existing.primaryColor,
        accentColor: body.accentColor ?? existing.accentColor,
        description: body.description !== undefined ? body.description : existing.description,
        address: body.address !== undefined ? body.address : existing.address,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        workingDays: body.workingDays ?? existing.workingDays,
        openTime: body.openTime ?? existing.openTime,
        closeTime: body.closeTime ?? existing.closeTime,
        slotDuration: body.slotDuration ?? existing.slotDuration,
        ...(body.newPassword ? { adminPassword: await hashPassword(body.newPassword) } : {}),
      },
      include: { services: true },
    });

    if (body.services) {
      await prisma.service.deleteMany({ where: { businessId: existing.id } });
      if (body.services.length > 0) {
        await prisma.service.createMany({
          data: body.services.map((s: { name: string; duration?: number; price?: number }) => ({
            businessId: existing.id,
            name: s.name,
            duration: s.duration ?? 30,
            price: s.price ?? null,
          })),
        });
      }
    }

    return NextResponse.json(publicBusiness(updated));
  } catch {
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}
