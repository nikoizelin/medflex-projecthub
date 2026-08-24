import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarRange } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { ProjectDetail } from "./project-detail";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const currentUser = await getCurrentUser();

  const [project, users] = await Promise.all([
  prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      status: true,
      color: true,
      startDate: true,
      deadline: true,
      calculated: true,
      ownerId: true,
      owner: { select: { name: true } },
      checklist: {
        select: { id: true, label: true, checked: true, order: true },
        orderBy: { order: "asc" },
      },
      testingEntries: {
        select: { id: true, title: true, link: true, issue: true, comment: true },
        orderBy: { order: "asc" },
      },
      comments: {
        select: {
          id: true,
          message: true,
          createdAt: true,
          authorId: true,
          author: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  }),
  prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!project) notFound();

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <Link
          href="/projektplanung/uebersicht"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Zurück
        </Link>
        {project.status === "LAUFEND" ? (
          <Link
            href={`/projektplanung/zeitplan?projekt=${project.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <CalendarRange className="size-4" />
            Zeitplan
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center gap-1.5 text-sm text-muted-foreground/40">
            <CalendarRange className="size-4" />
            Zeitplan
          </span>
        )}
      </div>

      <ProjectDetail
        project={{
          id: project.id,
          name: project.name,
          status: project.status,
          color: project.color,
          ownerId: project.ownerId,
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
          comments: project.comments.map((c) => ({
            id: c.id,
            message: c.message,
            createdAt: c.createdAt.toISOString(),
            authorId: c.authorId,
            authorName: c.author.name,
          })),
        }}
        users={users}
        currentUserId={currentUser?.id ?? ""}
        currentUserName={currentUser?.name ?? "Unbekannt"}
        initialTab={tab === "checkliste" || tab === "testing" ? tab : "zeitplan"}
      />
    </div>
  );
}
