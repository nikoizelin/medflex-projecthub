import { prisma } from "@/lib/prisma";
import { KalenderView } from "./kalender-view";

export default async function KalenderPage() {
  const projects = await prisma.project.findMany({
    where: { calculated: true },
    select: {
      id: true,
      name: true,
      color: true,
      steps: {
        select: { name: true, startDate: true, endDate: true },
        orderBy: { order: "asc" },
      },
    },
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
    <div className="flex h-[calc(100vh-5.5rem)] flex-col">
      <h1 className="mb-4 text-lg font-semibold">Kalender</h1>
      <KalenderView projects={data} />
    </div>
  );
}
