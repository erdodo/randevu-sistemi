import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTemplate } from "@/lib/templates";
import AdminClient from "@/components/admin/AdminClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const business = await prisma.business.findFirst();
    if (!business) return { title: "Yönetim Paneli" };
    return { title: `${business.name} - Yönetim Paneli` };
  } catch {
    return { title: "Yönetim Paneli" };
  }
}

export default async function AdminPage() {
  const business = await prisma.business.findFirst({
    include: {
      services: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!business || !business.isSetupComplete) {
    redirect("/");
  }

  const template = getTemplate(business.sector);

  return (
    <AdminClient
      business={business as Parameters<typeof AdminClient>[0]["business"]}
      template={template}
    />
  );
}
