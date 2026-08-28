"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { FormStep } from "@/lib/reception-form-templates";

function path(id: string) {
  return `/online-rezeption/${id}`;
}

// ─── Allgemein ────────────────────────────────────────────────────────────────

export async function updateClientGeneral(id: string, data: {
  widgetTitle: string;
  widgetSubtitle: string;
  defaultCountryCode: string;
  privacyPolicyText: string;
  privacyPolicyUrl: string;
  qa1Label: string; qa1Target: string;
  qa2Label: string; qa2Target: string;
  qa3Label: string; qa3Target: string;
}) {
  await prisma.receptionClient.update({ where: { id }, data });
  revalidatePath(path(id));
}

export async function uploadClientLogo(id: string, formData: FormData) {
  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) return;

  const ext = file.name.split(".").pop() ?? "png";
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const filePath = `logos/${id}.${ext}`;
  const { error } = await supabase.storage
    .from("reception-assets")
    .upload(filePath, buffer, { contentType: file.type, upsert: true });

  if (error) {
    console.error("Logo upload failed:", error.message);
    return;
  }

  const { data: { publicUrl } } = supabase.storage
    .from("reception-assets")
    .getPublicUrl(filePath);

  await prisma.receptionClient.update({ where: { id }, data: { logoPath: publicUrl } });
  revalidatePath(path(id));
}

export async function deleteClientLogo(id: string) {
  await prisma.receptionClient.update({ where: { id }, data: { logoPath: "" } });
  revalidatePath(path(id));
}

// ─── Standorte ────────────────────────────────────────────────────────────────

export async function createLocation(clientId: string) {
  const count = await prisma.receptionLocation.count({ where: { clientId } });
  const loc = await prisma.receptionLocation.create({
    data: {
      clientId,
      name: `Standort ${count + 1}`,
      order: count,
      openingHours: {
        create: [0, 1, 2, 3, 4].map((day) => ({
          dayOfWeek: day,
          openTime: "08:00",
          closeTime: "17:00",
        })).concat([5, 6].map((day) => ({ dayOfWeek: day, isClosed: true, openTime: "", closeTime: "" }))),
      },
    },
  });
  revalidatePath(path(clientId));
  return loc.id;
}

export async function updateLocation(locId: string, clientId: string, data: {
  name: string; address: string; phone: string;
}) {
  await prisma.receptionLocation.update({ where: { id: locId }, data });
  revalidatePath(path(clientId));
}

export async function deleteLocation(locId: string, clientId: string) {
  await prisma.receptionLocation.delete({ where: { id: locId } });
  revalidatePath(path(clientId));
}

export async function updateOpeningHours(
  locationId: string,
  clientId: string,
  hours: { id: string; dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean; note: string }[]
) {
  await Promise.all(
    hours.map((h) =>
      prisma.receptionOpeningHours.update({
        where: { id: h.id },
        data: { openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed, note: h.note },
      })
    )
  );
  revalidatePath(path(clientId));
}

// ─── Startseite ───────────────────────────────────────────────────────────────

export async function updateStartseite(id: string, data: {
  fachrichtung: string; introText: string;
}) {
  await prisma.receptionClient.update({ where: { id }, data });
  revalidatePath(path(id));
}

export async function createNews(clientId: string) {
  const count = await prisma.receptionNews.count({ where: { clientId } });
  await prisma.receptionNews.create({
    data: { clientId, title: "Neue Meldung", body: "", order: count },
  });
  revalidatePath(path(clientId));
}

export async function updateNews(newsId: string, clientId: string, data: {
  title: string; body: string;
}) {
  await prisma.receptionNews.update({ where: { id: newsId }, data });
  revalidatePath(path(clientId));
}

export async function deleteNews(newsId: string, clientId: string) {
  await prisma.receptionNews.delete({ where: { id: newsId } });
  revalidatePath(path(clientId));
}

// ─── Formular ─────────────────────────────────────────────────────────────────

export async function updateFormSteps(id: string, steps: FormStep[]) {
  await prisma.receptionClient.update({
    where: { id },
    data: { formSteps: steps as object[] },
  });
  revalidatePath(path(id));
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function updateChatConfig(id: string, elevenLabsAgentId: string) {
  await prisma.receptionClient.update({ where: { id }, data: { elevenLabsAgentId } });
  revalidatePath(path(id));
}
