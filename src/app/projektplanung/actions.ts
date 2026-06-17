"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import {
  PALETTE,
  baseChecklist,
  calculateSchedule,
  computeDeadline,
} from "@/lib/schedule";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const user = await getCurrentUser();
  if (!user) return;

  const projectCount = await prisma.project.count();
  const color = PALETTE[projectCount % PALETTE.length];

  await prisma.project.create({
    data: {
      name,
      color,
      ownerId: user.id,
      checklist: {
        create: baseChecklist.map((label, i) => ({ label, order: i, checked: false })),
      },
    },
  });

  revalidatePath("/projektplanung/uebersicht");
}

export async function updateProject(
  projectId: string,
  data: { name?: string; color?: string }
) {
  const update: { name?: string; color?: string } = {};

  if (data.name !== undefined) {
    const name = data.name.trim();
    if (!name) return;
    update.name = name;
  }

  if (data.color !== undefined) {
    if (!PALETTE.includes(data.color as (typeof PALETTE)[number])) return;
    update.color = data.color;
  }

  if (Object.keys(update).length === 0) return;

  await prisma.project.update({ where: { id: projectId }, data: update });

  revalidatePath("/projektplanung/uebersicht");
  revalidatePath("/projektplanung/zeitplan");
  revalidatePath("/projektplanung/kalender");
  revalidatePath(`/projektplanung/projekte/${projectId}`);
}

export async function deleteProject(projectId: string) {
  await prisma.project.delete({ where: { id: projectId } });

  revalidatePath("/projektplanung/uebersicht");
  revalidatePath("/projektplanung/zeitplan");
  revalidatePath("/projektplanung/kalender");
}

export async function calculateProject(projectId: string, startDate: string) {
  const start = new Date(startDate);
  const computed = calculateSchedule(start);
  const deadline = computeDeadline(computed);

  await prisma.scheduleStep.deleteMany({ where: { projectId } });
  await prisma.project.update({
    where: { id: projectId },
    data: {
      startDate: start,
      deadline,
      calculated: true,
      steps: {
        create: computed.map((s) => ({
          name: s.name,
          order: s.order,
          startDate: s.start,
          endDate: s.end,
        })),
      },
    },
  });

  revalidatePath("/projektplanung/uebersicht");
  revalidatePath("/projektplanung/zeitplan");
  revalidatePath("/projektplanung/kalender");
  revalidatePath(`/projektplanung/projekte/${projectId}`);
}

async function syncProjectStatusToChecklist(projectId: string) {
  const [items, project] = await Promise.all([
    prisma.checklistItem.findMany({ where: { projectId }, select: { checked: true } }),
    prisma.project.findUnique({ where: { id: projectId }, select: { status: true } }),
  ]);

  if (!project) return;

  const allChecked = items.length > 0 && items.every((i) => i.checked);

  if (allChecked && project.status !== "ABGESCHLOSSEN") {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "ABGESCHLOSSEN" },
    });
  } else if (!allChecked && project.status === "ABGESCHLOSSEN") {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "LAUFEND" },
    });
  }
}

export async function toggleChecklistItem(
  itemId: string,
  projectId: string,
  checked: boolean
) {
  await prisma.checklistItem.update({
    where: { id: itemId },
    data: { checked },
  });

  await syncProjectStatusToChecklist(projectId);

  revalidatePath("/projektplanung/uebersicht");
  revalidatePath(`/projektplanung/projekte/${projectId}`);
}

export async function addChecklistItem(projectId: string, label: string) {
  const trimmed = label.trim();
  if (!trimmed) return;

  const count = await prisma.checklistItem.count({ where: { projectId } });
  await prisma.checklistItem.create({
    data: { projectId, label: trimmed, order: count, checked: false },
  });

  await syncProjectStatusToChecklist(projectId);

  revalidatePath("/projektplanung/uebersicht");
  revalidatePath(`/projektplanung/projekte/${projectId}`);
}

export async function createTestingEntry(
  projectId: string,
  data: { title: string; link: string; issue: string; comment: string }
) {
  const title = data.title.trim();
  if (!title) return;

  const count = await prisma.testingEntry.count({ where: { projectId } });
  await prisma.testingEntry.create({
    data: {
      projectId,
      title,
      link: data.link.trim(),
      issue: data.issue.trim(),
      comment: data.comment.trim(),
      order: count,
    },
  });

  revalidatePath(`/projektplanung/projekte/${projectId}`);
}

export async function updateTestingEntry(
  entryId: string,
  projectId: string,
  data: { title: string; link: string; issue: string; comment: string }
) {
  const title = data.title.trim();
  if (!title) return;

  await prisma.testingEntry.update({
    where: { id: entryId },
    data: {
      title,
      link: data.link.trim(),
      issue: data.issue.trim(),
      comment: data.comment.trim(),
    },
  });

  revalidatePath(`/projektplanung/projekte/${projectId}`);
}

export async function deleteTestingEntry(entryId: string, projectId: string) {
  await prisma.testingEntry.delete({ where: { id: entryId } });

  revalidatePath(`/projektplanung/projekte/${projectId}`);
}
