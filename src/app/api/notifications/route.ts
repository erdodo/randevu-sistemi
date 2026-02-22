import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const slug = searchParams.get("slug");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    let resolvedBusinessId = businessId;

    if (slug) {
      const business = await prisma.business.findUnique({ where: { slug } });
      if (!business) return NextResponse.json({ error: "İşletme bulunamadı" }, { status: 404 });
      resolvedBusinessId = business.id;
    }

    if (!resolvedBusinessId) {
      return NextResponse.json({ error: "businessId gerekli" }, { status: 400 });
    }

    const where: Record<string, unknown> = { businessId: resolvedBusinessId };
    if (unreadOnly) where.isRead = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { businessId: resolvedBusinessId, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
