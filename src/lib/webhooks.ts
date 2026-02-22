import { prisma } from "@/lib/prisma";

type WebhookEvent = "appointment_created" | "appointment_approved";

interface AppointmentRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  status: string;
  notes?: string | null;
  createdAt: Date | string;
  service?: { name: string; duration: number; price?: number | null } | null;
}

function buildPayload(appt: AppointmentRecord) {
  return {
    id: appt.id,
    customerName: appt.customerName,
    customerPhone: appt.customerPhone,
    date: appt.date,
    time: appt.time,
    status: appt.status,
    service: appt.service ? { name: appt.service.name, duration: appt.service.duration, price: appt.service.price } : null,
    notes: appt.notes ?? null,
    createdAt: typeof appt.createdAt === "string" ? appt.createdAt : new Date(appt.createdAt).toISOString(),
  };
}

export async function triggerWebhooks(
  event: WebhookEvent,
  appointment: AppointmentRecord,
) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { event, isActive: true },
    });

    if (webhooks.length === 0) return;

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data: buildPayload(appointment),
    };

    for (const wh of webhooks) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (wh.secret) {
        headers["X-Webhook-Secret"] = wh.secret;
      }

      fetch(wh.url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      }).catch((err) => {
        console.error(`Webhook failed [${wh.url}]:`, err.message);
      });
    }
  } catch (err) {
    console.error("Webhook trigger error:", err);
  }
}
