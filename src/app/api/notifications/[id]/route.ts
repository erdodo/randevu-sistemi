import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (id === "all") {
      const businessId = body.businessId;
      if (!businessId) return NextResponse.json({ error: "businessId gerekli" }, { status: 400 });
      await prisma.notification.updateMany({
        where: { businessId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: body.isRead ?? true },
    });
    return NextResponse.json(notification);
  } catch {
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}
