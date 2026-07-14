-- CreateTable
CREATE TABLE "change_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kontaktperson" TEXT NOT NULL DEFAULT '',
    "praxis_kunde" TEXT NOT NULL DEFAULT '',
    "datum" DATE NOT NULL,
    "prioritaet" TEXT NOT NULL DEFAULT 'mittel',
    "beschreibung_problem" TEXT NOT NULL DEFAULT '',
    "link_anfrage" TEXT NOT NULL DEFAULT '',
    "fehlerhaftes_verhalten" TEXT NOT NULL DEFAULT '',
    "erwartes_verhalten" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'offen',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_requests_pkey" PRIMARY KEY ("id")
);
