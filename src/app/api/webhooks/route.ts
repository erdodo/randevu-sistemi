import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusiness, requireWritableBusiness } from "@/lib/session";

export async function GET() {
  try {
    const auth = await requireBusiness();
    if (auth.error) return auth.error;
    const webhooks = await prisma.webhook.findMany({
      where: { businessId: auth.business.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(webhooks);
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireWritableBusiness();
    if (auth.error) return auth.error;
    const body = await req.json();
    const { url, event, secret } = body as {
      url: string;
      event: string;
      secret?: string;
    };

    if (!url || !event) {
      return NextResponse.json({ error: "URL ve event gerekli" }, { status: 400 });
    }

    if (!["appointment_created", "appointment_approved"].includes(event)) {
      return NextResponse.json({ error: "Geçersiz event tipi" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Geçersiz URL" }, { status: 400 });
    }

    const webhook = await prisma.webhook.create({
      data: {
        businessId: auth.business.id,
        url,
        event,
        secret: secret || null,
        isActive: true,
      },
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Oluşturma başarısız" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireWritableBusiness();
    if (auth.error) return auth.error;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

    const { count } = await prisma.webhook.deleteMany({ where: { id, businessId: auth.business.id } });
    if (!count) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Silme başarısız" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireWritableBusiness();
    if (auth.error) return auth.error;
    const body = await req.json();
    const { id, isActive, url, event, secret } = body as {
      id: string;
      isActive?: boolean;
      url?: string;
      event?: string;
      secret?: string | null;
    };

    if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (url) data.url = url;
    if (event) data.event = event;
    if (secret !== undefined) data.secret = secret;

    const { count } = await prisma.webhook.updateMany({
      where: { id, businessId: auth.business.id },
      data,
    });
    if (!count) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

    return NextResponse.json(await prisma.webhook.findUnique({ where: { id } }));
  } catch {
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}
