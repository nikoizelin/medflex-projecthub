"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ContactInfo {
  kontaktperson: string;
  praxisKunde: string;
  email: string;
}

export interface ScreenshotInput {
  filename: string;
  mimeType: string;
  data: string; // base64
}

export interface ChangeRequestEntryInput {
  datum: string;
  kategorie: string;
  beschreibungProblem: string;
  linkAnfrage: string;
  fehlerhaftesVerhalten: string;
  erwartesVerhalten: string;
  screenshots: ScreenshotInput[];
}

export async function submitSupportRequest(
  contact: ContactInfo,
  entries: ChangeRequestEntryInput[]
) {
  if (!entries.length) return;

  await prisma.supportRequest.create({
    data: {
      kontaktperson: contact.kontaktperson.trim(),
      praxisKunde: contact.praxisKunde.trim(),
      email: contact.email.trim(),
      entries: {
        create: entries.map((e) => ({
          datum: new Date(e.datum),
          kategorie: e.kategorie,
          beschreibungProblem: e.beschreibungProblem.trim(),
          linkAnfrage: e.linkAnfrage.trim(),
          fehlerhaftesVerhalten: e.fehlerhaftesVerhalten.trim(),
          erwartesVerhalten: e.erwartesVerhalten.trim(),
          screenshots: {
            create: e.screenshots.map((s) => ({
              filename: s.filename,
              mimeType: s.mimeType,
              data: s.data,
            })),
          },
        })),
      },
    },
  });

  if (contact.email) {
    const { sendSupportConfirmationEmail } = await import("@/lib/email");
    await sendSupportConfirmationEmail({
      to: contact.email,
      contactName: contact.kontaktperson,
      praxisKunde: contact.praxisKunde,
      entries,
    }).catch(() => {});
  }
}

export async function updateChangeRequestStatus(id: string, status: string) {
  await prisma.changeRequest.update({ where: { id }, data: { status } });
  revalidatePath("/support/anfragen");
}

export async function updateChangeRequestPriority(id: string, prioritaet: string) {
  await prisma.changeRequest.update({ where: { id }, data: { prioritaet } });
  revalidatePath("/support/anfragen");
}

export async function updateChangeRequestKommentar(id: string, kommentar: string) {
  await prisma.changeRequest.update({ where: { id }, data: { kommentar } });
  revalidatePath("/support/anfragen");
}

export async function updateChangeRequestAssignee(id: string, assigneeId: string | null) {
  const entry = await prisma.changeRequest.update({
    where: { id },
    data: { assigneeId: assigneeId || null },
    include: {
      assignee: true,
      supportRequest: true,
    },
  });

  if (assigneeId && entry.assignee?.email) {
    const { sendSupportAssignmentEmail } = await import("@/lib/email");
    await sendSupportAssignmentEmail({
      to: entry.assignee.email,
      assigneeName: entry.assignee.name,
      kontaktperson: entry.supportRequest.kontaktperson,
      praxisKunde: entry.supportRequest.praxisKunde,
      kategorie: entry.kategorie,
      beschreibungProblem: entry.beschreibungProblem,
      prioritaet: entry.prioritaet,
      datum: entry.datum.toISOString().slice(0, 10),
    }).catch(() => {});
  }

  revalidatePath("/support/anfragen");
}
