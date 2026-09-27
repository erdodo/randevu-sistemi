import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPassword, clearSession, requireBusiness } from "@/lib/session";

// Oturumu açık işletmeyi ve tüm verilerini siler (şifre doğrulamasıyla)
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireBusiness();
    if (auth.error) return auth.error;
    const business = auth.business;

    const body = await req.json();
    const password = String(body?.password ?? "").trim();
    if (!password) {
      return NextResponse.json({ error: "Şifre gerekli" }, { status: 400 });
    }
    if (!(await checkPassword(password, business.adminPassword))) {
      return NextResponse.json({ error: "Şifre hatalı" }, { status: 401 });
    }

    // Randevu, hizmet ve bildirimler işletmeyle birlikte (cascade) silinir
    await prisma.$transaction([
      prisma.webhook.deleteMany({ where: { businessId: business.id } }),
      prisma.business.delete({ where: { id: business.id } }),
    ]);

    const res = NextResponse.json({ success: true });
    clearSession(res);
    return res;
  } catch {
    return NextResponse.json({ error: "Veriler silinemedi" }, { status: 500 });
  }
}
