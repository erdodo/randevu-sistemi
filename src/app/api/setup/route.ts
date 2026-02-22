import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SECTOR_TEMPLATES, Sector } from "@/lib/templates";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sector, name, phone, password, address, description } = body as {
      sector: string;
      name: string;
      phone: string;
      password: string;
      address?: string;
      description?: string;
    };

    if (!sector || !name || !phone || !password) {
      return NextResponse.json({ error: "Zorunlu alanlar eksik" }, { status: 400 });
    }

    const existing = await prisma.business.findFirst();
    if (existing) {
      return NextResponse.json({ error: "Dükkan zaten kurulmuş" }, { status: 409 });
    }

    const template = SECTOR_TEMPLATES[sector as Sector];
    if (!template) {
      return NextResponse.json({ error: "Geçersiz sektör" }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim() || "dukkan";

    const business = await prisma.business.create({
      data: {
        name,
        slug,
        sector,
        primaryColor: template.primaryColor,
        accentColor: template.accentColor,
        description: description || template.tagline,
        address: address || null,
        phone,
        adminPassword: password,
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

    return NextResponse.json({ success: true, business }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Kurulum başarısız" }, { status: 500 });
  }
}
