"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createNotification } from "@/lib/notifications";
import { validateRequest } from "@/lib/support-validation";

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

export type SubmitResult =
  | { ok: true; confirmationSent: boolean }
  | { ok: false; error: string };

export async function submitSupportRequest(
  contact: ContactInfo,
  rawEntries: ChangeRequestEntryInput[],
  honeypot: string | undefined,
  consent: boolean
): Promise<SubmitResult> {
  // Honeypot: bots fill hidden fields, humans don't
  if (honeypot) return { ok: true, confirmationSent: false };

  // Rate limiting (requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
  const ratelimit = await getRateLimit();
  if (ratelimit) {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
    const { success } = await ratelimit.limit(ip);
    if (!success) return { ok: false, error: "Zu viele Anfragen. Bitte warten Sie eine Minute." };
  }

  // Server-side validation (nie dem Client vertrauen)
  const today = new Date().toISOString().slice(0, 10);
  const entries = (rawEntries ?? []).map((e) => ({ ...e, datum: e.datum || today }));
  const validationError = validateRequest(contact, entries, consent === true);
  if (validationError) return { ok: false, error: validationError };

  for (const e of entries) {
    if (!VALID_KATEGORIEN.includes(e.kategorie)) return { ok: false, error: "Ungültige Kategorie." };
    if (e.screenshots.length > 5) return { ok: false, error: "Maximal 5 Screenshots pro Eintrag." };
    for (const s of e.screenshots) {
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(s.mimeType)) {
        return { ok: false, error: "Nur Bilddateien (JPG, PNG, WebP, GIF) sind erlaubt." };
      }
      if (s.data.length > 4_000_000) return { ok: false, error: "Ein Screenshot ist zu gross (max. ca. 3 MB)." };
    }
  }

  try {
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
                filename: s.filename.replace(/[^\w.\- ]/g, "_").slice(0, 120),
                mimeType: s.mimeType,
                data: s.data,
              })),
            },
          })),
        },
      },
    });
  } catch (err) {
    console.error("submitSupportRequest failed:", err);
    return { ok: false, error: "Die Anfrage konnte nicht gespeichert werden. Bitte versuchen Sie es später erneut." };
  }

  const { sendSupportConfirmationEmail, sendSupportInternalNotificationEmail } = await import("@/lib/email");

  await sendSupportInternalNotificationEmail({
    contactName: contact.kontaktperson,
    praxisKunde: contact.praxisKunde,
    email: contact.email,
    entries,
  }).catch(() => {});

  const confirmationSent = await sendSupportConfirmationEmail({
    to: contact.email,
    contactName: contact.kontaktperson,
    praxisKunde: contact.praxisKunde,
    entries,
  }).then(() => true, () => false);

  return { ok: true, confirmationSent };
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

  if (assigneeId && entry.assignee) {
    if (entry.assignee.email) {
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
    await createNotification(
      assigneeId,
      "SUPPORT_ASSIGNED",
      "Support-Anfrage zugewiesen",
      `Dir wurde eine Anfrage von ${entry.supportRequest.praxisKunde || entry.supportRequest.kontaktperson} zugewiesen.`,
      "/support/anfragen"
    );
  }

  revalidatePath("/support/anfragen");
}
