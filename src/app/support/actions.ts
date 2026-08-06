"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

const VALID_KATEGORIEN = ["telefonassistent", "medflex-app", "featurewunsch", "sonstiges"];

async function getRateLimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: false,
  });
}

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
  entries: ChangeRequestEntryInput[],
  honeypot?: string
) {
  // Honeypot: bots fill hidden fields, humans don't
  if (honeypot) return;

  // Rate limiting (requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
  const ratelimit = await getRateLimit();
  if (ratelimit) {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
    const { success } = await ratelimit.limit(ip);
    if (!success) throw new Error("Zu viele Anfragen. Bitte warte eine Minute.");
  }

  // Server-side validation
  if (!contact.kontaktperson?.trim() || !contact.praxisKunde?.trim()) return;
  if (contact.kontaktperson.length > 200 || contact.praxisKunde.length > 200) return;
  if (contact.email && contact.email.length > 300) return;
  if (!entries.length || entries.length > 10) return;

  for (const e of entries) {
    if (!VALID_KATEGORIEN.includes(e.kategorie)) return;
    if (!e.beschreibungProblem?.trim() || e.beschreibungProblem.length > 10000) return;
    if (e.linkAnfrage.length > 500) return;
    if (e.fehlerhaftesVerhalten.length > 10000) return;
    if (e.erwartesVerhalten.length > 10000) return;
    if (e.screenshots.length > 5) return;
    for (const s of e.screenshots) {
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(s.mimeType)) return;
      if (s.data.length > 4_000_000) return; // ~3 MB base64
    }
  }

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

  const { sendSupportConfirmationEmail, sendSupportInternalNotificationEmail } = await import("@/lib/email");

  await sendSupportInternalNotificationEmail({
    contactName: contact.kontaktperson,
    praxisKunde: contact.praxisKunde,
    email: contact.email,
    entries,
  }).catch(() => {});

  if (contact.email) {
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

export async function archiveChangeRequest(id: string, archived: boolean) {
  await prisma.changeRequest.update({ where: { id }, data: { archived } });
  revalidatePath("/support/anfragen");
}

export async function archiveSupportRequest(id: string, archived: boolean) {
  await prisma.supportRequest.update({ where: { id }, data: { archived } });
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
