-- Support Modul Restrukturierung: Parent/Sub-Ticket Struktur, Assignee, Kategorie, Screenshots

-- Bestehende Testdaten löschen (change_requests hat keine kritischen Produktionsdaten)
TRUNCATE TABLE "change_requests";

-- CreateTable: support_requests (übergeordnete Anfrage mit Kontaktdaten)
CREATE TABLE "support_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kontaktperson" TEXT NOT NULL DEFAULT '',
    "praxis_kunde" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable: screenshot_attachments (base64-kodierte Screenshots pro Eintrag)
CREATE TABLE "screenshot_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "change_request_id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL DEFAULT 'image/png',
    "data" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "screenshot_attachments_pkey" PRIMARY KEY ("id")
);

-- AlterTable: change_requests – alte Kontaktfelder entfernen, neue Felder hinzufügen
ALTER TABLE "change_requests"
    DROP COLUMN IF EXISTS "kontaktperson",
    DROP COLUMN IF EXISTS "praxis_kunde",
    ADD COLUMN "support_request_id" UUID NOT NULL,
    ADD COLUMN "kategorie" TEXT NOT NULL DEFAULT 'sonstiges',
    ADD COLUMN "assignee_id" TEXT,
    ADD COLUMN "kommentar" TEXT NOT NULL DEFAULT '';

-- AddForeignKey: change_requests → support_requests
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_support_request_id_fkey"
    FOREIGN KEY ("support_request_id") REFERENCES "support_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: change_requests → User (assignee)
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_assignee_id_fkey"
    FOREIGN KEY ("assignee_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: screenshot_attachments → change_requests
ALTER TABLE "screenshot_attachments" ADD CONSTRAINT "screenshot_attachments_change_request_id_fkey"
    FOREIGN KEY ("change_request_id") REFERENCES "change_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "change_requests_support_request_id_idx" ON "change_requests"("support_request_id");
CREATE INDEX "change_requests_assignee_id_idx" ON "change_requests"("assignee_id");
CREATE INDEX "screenshot_attachments_change_request_id_idx" ON "screenshot_attachments"("change_request_id");

-- RLS für neue Tabellen (anon kann Anfragen einreichen)
ALTER TABLE "support_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "screenshot_attachments" ENABLE ROW LEVEL SECURITY;
