import { prisma } from "@/lib/prisma";
import { PHASE_NAMES, getActivePhaseIndex } from "@/lib/schedule";
import { ProjectOverview } from "./project-overview";

export default async function UebersichtPage() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      color: true,
      calculated: true,
      owner: { select: { name: true } },
      checklist: { select: { order: true, checked: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const data = projects.map((p) => {
    const total = p.checklist.length;
    const checkedCount = p.checklist.filter((c) => c.checked).length;
    const progress = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
    const phaseLabel = PHASE_NAMES[getActivePhaseIndex(p.checklist)];

    return {
      id: p.id,
      name: p.name,
      status: p.status,
      color: p.color,
      ownerName: p.owner.name,
      calculated: p.calculated,
      progress,
      phaseLabel,
    };
  });

  return <ProjectOverview projects={data} />;
}
