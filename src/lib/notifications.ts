import { prisma } from "./prisma";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  href: string
) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body, href },
    });
  } catch {
    // Non-critical — don't surface to user
  }
}
