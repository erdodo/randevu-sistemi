import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTemplate } from "@/lib/templates";
import { publicBusiness } from "@/lib/session";
import BookingClient from "@/components/customer/BookingClient";

export const dynamic = "force-dynamic";

async function getBusiness(slug: string) {
  return prisma.business.findUnique({
    where: { slug },
    include: {
      services: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
    },
  });
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusiness(slug);
  return { title: business ? `${business.name} - Online Randevu` : "Randevu Sistemi" };
}

// İşletmenin müşterilere açık randevu sayfası
export default async function BusinessBookingPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const business = await getBusiness(slug);
  if (!business || !business.isSetupComplete) notFound();

  const template = getTemplate(business.sector);

  return (
    <BookingClient
      business={publicBusiness(business) as Parameters<typeof BookingClient>[0]["business"]}
      template={template}
    />
  );
}
