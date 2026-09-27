import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireBusiness();
    if (auth.error) return auth.error;
    const businessId = auth.business.id;
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    if (id === "all") {
      await prisma.notification.updateMany({
        where: { businessId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    const { count } = await prisma.notification.updateMany({
      where: { id, businessId },
      data: { isRead: body.isRead ?? true },
    });
    if (!count) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}
