import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SECTOR_TEMPLATES, Sector } from "@/lib/templates";
import { hashPassword, RESERVED_SLUGS, setSession, slugify } from "@/lib/session";
import { BURST_MESSAGE, burstSince, isSignupBurst, spamCheck } from "@/lib/antispam";

// Yeni işletme kaydı: işletme + varsayılan hizmetler oluşturulur ve yönetici oturumu açılır.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const spam = spamCheck(body);
    if (spam) return NextResponse.json({ error: spam }, { status: 400 });
    if (isSignupBurst(await prisma.business.count({ where: { createdAt: { gte: burstSince() } } }))) {
      return NextResponse.json({ error: BURST_MESSAGE }, { status: 429 });
    }
    const { sector, name, phone, password, address, description } = body as {
      sector: string;
      name: string;
      phone: string;
      password: string;
      address?: string;
      description?: string;
    };

    if (!sector || !name?.trim() || !phone?.trim() || !password) {
      return NextResponse.json({ error: "Zorunlu alanlar eksik" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalı" }, { status: 400 });
    }

    const template = SECTOR_TEMPLATES[sector as Sector];
    if (!template) {
      return NextResponse.json({ error: "Geçersiz sektör" }, { status: 400 });
    }

    // Benzersiz adres: aynı isimde işletme varsa sonuna sayı eklenir
    const base = slugify(name) || "isletme";
    let slug = RESERVED_SLUGS.has(base) ? `${base}-1` : base;
    for (let i = 2; await prisma.business.findUnique({ where: { slug }, select: { id: true } }); i++) {
      slug = `${base}-${i}`;
    }

    const business = await prisma.business.create({
      data: {
        name: name.trim(),
        slug,
        sector,
        primaryColor: template.primaryColor,
        accentColor: template.accentColor,
        description: description || template.tagline,
        address: address || null,
        phone: phone.trim(),
        adminPassword: await hashPassword(password),
        workingDays: "1,2,3,4,5,6",
        openTime: "09:00",
        closeTime: "18:00",
        slotDuration: 30,
        isSetupComplete: true,
      },
    });

    await prisma.service.createMany({
      data: template.defaultServices.map((sName) => ({
        businessId: business.id,
        name: sName,
        duration: 30,
      })),
    });

    const res = NextResponse.json({ success: true, slug: business.slug }, { status: 201 });
    await setSession(res, { businessId: business.id, slug: business.slug });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 });
  }
}
