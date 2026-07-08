"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { TicketStatus, TicketPriority } from "@/generated/prisma";
import { sendTicketAssignmentEmail } from "@/lib/email";

async function notifyAssignee({
  assigneeId,
  oldAssigneeId,
  creatorName,
  title,
  description,
  priority,
  status,
  isUpdate,
}: {
  assigneeId: string | null;
  oldAssigneeId?: string | null;
  creatorName: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  isUpdate: boolean;
}) {
  if (!assigneeId) return;
  if (isUpdate && assigneeId === oldAssigneeId) return;

  const assignee = await prisma.user.findUnique({ where: { id: assigneeId }, select: { email: true, name: true } });
  if (!assignee) return;

  await sendTicketAssignmentEmail({
    to: assignee.email,
    assigneeName: assignee.name,
    creatorName,
    ticketTitle: title,
    ticketDescription: description,
    ticketPriority: priority,
    ticketStatus: status,
    isUpdate,
  }).catch(() => {});
}

export async function createTicket(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const assigneeId = String(formData.get("assigneeId") ?? "").trim() || null;
  const priorityRaw = String(formData.get("priority") ?? "MITTEL").trim();
  const priority = (Object.values(TicketPriority).includes(priorityRaw as TicketPriority)
    ? priorityRaw
    : "MITTEL") as TicketPriority;

  if (!title) return;

  const user = await getCurrentUser();
  if (!user) return;

  await prisma.ticket.create({
    data: { title, description, creatorId: user.id, assigneeId, priority },
  });

  await notifyAssignee({ assigneeId, creatorName: user.name, title, description, priority, status: TicketStatus.NEU, isUpdate: false });

  revalidatePath("/ticketsystem/board");
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status },
  });

  revalidatePath("/ticketsystem/board");
}

export async function updateTicket(
  ticketId: string,
  data: { title: string; description: string; assigneeId: string | null; priority: TicketPriority }
) {
  const title = data.title.trim();
  if (!title) return;

  const user = await getCurrentUser();
  if (!user) return;

  const existing = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { assigneeId: true, status: true },
  });

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { title, description: data.description.trim(), assigneeId: data.assigneeId, priority: data.priority },
  });

  await notifyAssignee({
    assigneeId: data.assigneeId,
    oldAssigneeId: existing?.assigneeId ?? null,
    creatorName: user.name,
    title,
    description: data.description,
    priority: data.priority,
    status: updated.status,
    isUpdate: true,
  });

  revalidatePath("/ticketsystem/board");
}

export async function deleteTicket(ticketId: string) {
  await prisma.ticket.delete({ where: { id: ticketId } });

  revalidatePath("/ticketsystem/board");
}

export async function createTicketComment(ticketId: string, message: string) {
  const trimmed = message.trim();
  if (!trimmed) return;

  const user = await getCurrentUser();
  if (!user) return;

  await prisma.ticketComment.create({
    data: { ticketId, authorId: user.id, message: trimmed },
  });

  revalidatePath("/ticketsystem/board");
}

export async function deleteTicketComment(commentId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  await prisma.ticketComment.deleteMany({
    where: { id: commentId, authorId: user.id },
  });

  revalidatePath("/ticketsystem/board");
}
