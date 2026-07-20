-- Kolumne kommentar wurde manuell in Supabase entfernt – Migration synchronisiert Prisma-State
ALTER TABLE "change_requests" DROP COLUMN IF EXISTS "kommentar";
