import { prisma } from "@/lib/prisma";
import { getTemplate } from "@/lib/templates";
import SetupWizard from "@/components/setup/SetupWizard";
import BookingClient from "@/components/customer/BookingClient";

export const dynamic = "force-dynamic";

async function getBusiness() {
  try {
    return await prisma.business.findFirst({
      include: {
        services: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      },
    });
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const business = await getBusiness();

  if (!business || !business.isSetupComplete) {
    return <SetupWizard />;
  }

  const template = getTemplate(business.sector);

  return (
    <BookingClient
      business={business as Parameters<typeof BookingClient>[0]["business"]}
      template={template}
    />
  );
}
