import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ClientConfig } from "./client-config";

export default async function ClientConfigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.receptionClient.findUnique({
    where: { id },
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
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/online-rezeption"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Alle Kunden
        </Link>
      </div>

      <div className="mb-4">
        <h1 className="text-lg font-semibold">{client.name}</h1>
        <p className="text-xs text-muted-foreground">
          Widget-ID: <span className="font-mono">{client.slug}</span>
        </p>
      </div>

      <ClientConfig client={client as any} />
    </div>
  );
}
