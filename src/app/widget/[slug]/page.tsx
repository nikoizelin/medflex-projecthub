import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WidgetApp } from "./widget-app";
import type { FormType } from "@/lib/reception-form-templates";

export default async function WidgetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const client = await prisma.receptionClient.findUnique({
    where: { slug },
    include: {
      locations: {
        orderBy: { order: "asc" },
        include: { openingHours: { orderBy: { dayOfWeek: "asc" } } },
      },
      news: { orderBy: { order: "asc" } },
    },
  });

  if (!client) notFound();

  return (
    <WidgetApp
      config={{
        id: client.id,
        slug: client.slug,
        name: client.name,
        logoPath: client.logoPath,
        widgetTitle: client.widgetTitle || client.name,
        widgetSubtitle: client.widgetSubtitle,
        accentColor: client.accentColor,
        defaultCountryCode: client.defaultCountryCode,
        elevenLabsAgentId: client.elevenLabsAgentId,
        privacyPolicyText: client.privacyPolicyText,
        privacyPolicyUrl: client.privacyPolicyUrl,
        qa1Label: client.qa1Label, qa1Target: client.qa1Target,
        qa2Label: client.qa2Label, qa2Target: client.qa2Target,
        qa3Label: client.qa3Label, qa3Target: client.qa3Target,
        fachrichtung: client.fachrichtung,
        introText: client.introText,
        formSteps: (client.formSteps as unknown as FormType[]) ?? [],
        locations: client.locations.map((l) => ({
          id: l.id,
          name: l.name,
          address: l.address,
          phone: l.phone,
          openingHoursText: l.openingHoursText,
          isDefault: l.isDefault,
          openingHours: l.openingHours.map((h) => ({
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed,
            note: h.note,
          })),
        })),
        news: client.news.map((n) => ({ id: n.id, title: n.title, body: n.body })),
      }}
    />
  );
}
