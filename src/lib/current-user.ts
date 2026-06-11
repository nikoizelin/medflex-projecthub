import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Liefert den eingeloggten Benutzer und stellt sicher, dass eine
 * passende Zeile in der App-eigenen `User`-Tabelle existiert
 * (verknüpft über die Supabase-Auth-User-ID).
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const existing = await prisma.user.findUnique({ where: { id: user.id } });
  if (existing) return existing;

  const name =
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Unbekannt";

  return prisma.user.create({
    data: {
      id: user.id,
      email: user.email ?? "",
      name,
    },
  });
}
