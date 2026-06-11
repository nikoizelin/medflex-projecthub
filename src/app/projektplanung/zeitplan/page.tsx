import { prisma } from "@/lib/prisma";
import { ZeitplanView } from "./zeitplan-view";

export default async function ZeitplanPage() {
  const projects = await prisma.project.findMany({
    where: { calculated: true },
    include: { steps: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  const data = projects.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    steps: p.steps.map((s) => ({
      name: s.name,
      start: s.startDate.toISOString(),
      end: s.endDate.toISOString(),
    })),
  }));

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Zeitplan</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Berechneter Projektzeitplan je Projekt (Werktage Mo–Fr).
      </p>
      <ZeitplanView projects={data} />
    </div>
  );
}
