import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTemplate } from "@/lib/templates";
import { getSession, publicBusiness } from "@/lib/session";
import AdminClient from "@/components/admin/AdminClient";
import CampaignBanner from "@/components/CampaignBanner";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[slug]/admin">): Promise<Metadata> {
  const { slug } = await params;
  const business = await prisma.business.findUnique({ where: { slug }, select: { name: true } });
  return { title: business ? `${business.name} - Yönetim Paneli` : "Yönetim Paneli" };
}

export default async function AdminPage({ params }: PageProps<"/[slug]/admin">) {
  const { slug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      services: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!business || !business.isSetupComplete) notFound();

  const session = await getSession();
  const authed = session?.businessId === business.id;

  return (
    <>
      {authed && <CampaignBanner slug={business.slug} />}
      {authed && (
        <div className="bg-gray-900 px-4 py-2 text-center text-xs text-white/70">
          Müşterileriniz için randevu adresi:{" "}
          <a href={`/${business.slug}`} target="_blank" className="font-mono font-semibold text-white underline underline-offset-2">
            /{business.slug}
          </a>
        </div>
      )}
      <AdminClient
        business={publicBusiness(business) as Parameters<typeof AdminClient>[0]["business"]}
        template={getTemplate(business.sector)}
        initialAuthed={authed}
      />
    </>
  );
}
