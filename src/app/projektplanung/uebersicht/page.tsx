import { prisma } from "@/lib/prisma";
import { ProjectOverview } from "./project-overview";

export default async function UebersichtPage() {
  const projects = await prisma.project.findMany({
    include: { checklist: true, owner: true },
    orderBy: { createdAt: "asc" },
  });

  const data = projects.map((p) => {
    const total = p.checklist.length;
    const checkedCount = p.checklist.filter((c) => c.checked).length;
    const progress = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

    return {
      id: p.id,
      name: p.name,
      status: p.status,
      color: p.color,
      ownerName: p.owner.name,
      calculated: p.calculated,
      progress,
    };
  });

  return <ProjectOverview projects={data} />;
}
