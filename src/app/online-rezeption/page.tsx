import Link from "next/link";
import { Plus, MonitorSmartphone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ReceptionClientList } from "./reception-client-list";

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
            <Link
              key={c.id}
              href={`/online-rezeption/${c.id}`}
              className="group rounded-lg border bg-background p-4 transition-colors hover:border-foreground/20"
            >
              <div className="mb-3 flex items-center gap-3">
                {c.logoPath ? (
                  <img src={c.logoPath} alt={c.name} className="size-10 rounded-md object-contain" />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                    <MonitorSmartphone className="size-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium leading-tight">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c._count.locations} {c._count.locations === 1 ? "Standort" : "Standorte"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Widget-ID: <span className="font-mono">{c.slug}</span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
