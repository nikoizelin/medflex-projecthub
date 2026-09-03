import { MonitorSmartphone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ReceptionClientList, ClientCard } from "./reception-client-list";

export default async function OnlineRezeptionPage() {
  const clients = await prisma.receptionClient.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      logoPath: true,
      _count: { select: { locations: true } },
    },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Online Rezeption</h1>
          <p className="text-sm text-muted-foreground">Kunden & Widget-Konfiguration</p>
        </div>
        <ReceptionClientList clients={clients} />
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <MonitorSmartphone className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium">Noch keine Kunden angelegt</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Klicke auf «Kunde hinzufügen» um loszulegen.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <ClientCard key={c.id} client={c} />
          ))}
        </div>
      )}
    </div>
  );
}
