"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { TicketStatus } from "@/generated/prisma";

export async function createTicket(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const assigneeId = String(formData.get("assigneeId") ?? "").trim() || null;
  if (!title) return;

  const user = await getCurrentUser();
  if (!user) return;

  await prisma.ticket.create({
    data: { title, description, creatorId: user.id, assigneeId },
  });

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
  data: { title: string; description: string; assigneeId: string | null }
) {
  const title = data.title.trim();
  if (!title) return;

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { title, description: data.description.trim(), assigneeId: data.assigneeId },
  });

  revalidatePath("/ticketsystem/board");
}

export async function deleteTicket(ticketId: string) {
  await prisma.ticket.delete({ where: { id: ticketId } });

  revalidatePath("/ticketsystem/board");
}
