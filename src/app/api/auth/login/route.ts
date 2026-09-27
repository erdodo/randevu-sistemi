import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPassword, hashPassword, setSession, slugify } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { slug, password } = (await req.json()) as { slug?: string; password?: string };
    if (!slug || !password) {
      return NextResponse.json({ error: "İşletme adresi ve şifre gerekli" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { slug: slugify(slug) } });
    if (!business || !(await checkPassword(password, business.adminPassword))) {
      return NextResponse.json({ error: "İşletme adresi veya şifre hatalı" }, { status: 401 });
    }

    // Eski düz metin şifreyi ilk başarılı girişte hash'e çevir
    if (!business.adminPassword.startsWith("$2")) {
      await prisma.business.update({ where: { id: business.id }, data: { adminPassword: await hashPassword(password) } });
    }

    const res = NextResponse.json({ success: true, slug: business.slug });
    await setSession(res, { businessId: business.id, slug: business.slug });
    return res;
  } catch {
    return NextResponse.json({ error: "Giriş yapılamadı" }, { status: 500 });
  }
}
