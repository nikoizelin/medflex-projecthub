-- AlterTable
ALTER TABLE "ChecklistItem" ADD COLUMN     "category" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "ReceptionClient" ADD COLUMN     "openingHoursLabel" TEXT NOT NULL DEFAULT 'Öffnungszeiten';

-- Bestehende Punkte anhand der Phasen-Trigger (order 4/5/13/21/25) einer Kategorie zuordnen
UPDATE "ChecklistItem" SET "category" = CASE
  WHEN "order" >= 25 THEN 'Monitoring'
  WHEN "order" >= 21 THEN 'Go-Live'
  WHEN "order" >= 13 THEN 'Schulung'
  WHEN "order" >= 5 THEN 'Entwicklung'
  WHEN "order" >= 4 THEN 'Setup'
  ELSE 'Vorbereitung'
END;
