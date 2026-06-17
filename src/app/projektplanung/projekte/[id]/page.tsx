import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProjectDetail } from "./project-detail";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      status: true,
      color: true,
      startDate: true,
      deadline: true,
      calculated: true,
      owner: { select: { name: true } },
      checklist: {
        select: { id: true, label: true, checked: true, order: true },
        orderBy: { order: "asc" },
      },
      testingEntries: {
        select: { id: true, title: true, link: true, issue: true, comment: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!project) notFound();

  return (
    <div>
      <Link
        href="/projektplanung/uebersicht"
        className="mb-2.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Zurück
      </Link>

      <ProjectDetail
        project={{
          id: project.id,
          name: project.name,
          status: project.status,
          color: project.color,
          ownerName: project.owner.name,
          startDate: project.startDate?.toISOString() ?? null,
          deadline: project.deadline?.toISOString() ?? null,
          calculated: project.calculated,
          checklist: project.checklist.map((c) => ({
            id: c.id,
            label: c.label,
            checked: c.checked,
            order: c.order,
          })),
          testingEntries: project.testingEntries.map((t) => ({
            id: t.id,
            title: t.title,
            link: t.link,
            issue: t.issue,
            comment: t.comment,
          })),
        }}
      />
    </div>
  );
}
