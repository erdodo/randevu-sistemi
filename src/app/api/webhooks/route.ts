import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(webhooks);
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

    await prisma.webhook.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Silme başarısız" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
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

    const webhook = await prisma.webhook.update({
      where: { id },
      data,
    });

    return NextResponse.json(webhook);
  } catch {
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}
