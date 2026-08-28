"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let i = 2;
  while (true) {
    const existing = await prisma.receptionClient.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${i++}`;
  }
}

export async function createReceptionClient(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const slug = await uniqueSlug(toSlug(name));

  const client = await prisma.receptionClient.create({
    data: {
      name,
      slug,
      widgetTitle: name,
      locations: {
        create: {
          name: "Hauptstandort",
          isDefault: true,
          openingHours: {
            create: [0, 1, 2, 3, 4].map((day) => ({
              dayOfWeek: day,
              openTime: "08:00",
              closeTime: "17:00",
            })).concat([5, 6].map((day) => ({ dayOfWeek: day, isClosed: true, openTime: "", closeTime: "" }))),
          },
        },
      },
    },
  });

  revalidatePath("/online-rezeption");
  return client.id;
}

export async function deleteReceptionClient(id: string) {
  await prisma.receptionClient.delete({ where: { id } });
  revalidatePath("/online-rezeption");
}
