-- CreateTable
CREATE TABLE "ReceptionClient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoPath" TEXT NOT NULL DEFAULT '',
    "widgetTitle" TEXT NOT NULL DEFAULT '',
    "widgetSubtitle" TEXT NOT NULL DEFAULT '',
    "defaultCountryCode" TEXT NOT NULL DEFAULT '+41',
    "elevenLabsAgentId" TEXT NOT NULL DEFAULT '',
    "privacyPolicyText" TEXT NOT NULL DEFAULT '',
    "privacyPolicyUrl" TEXT NOT NULL DEFAULT '',
    "qa1Label" TEXT NOT NULL DEFAULT 'Termin',
    "qa1Target" TEXT NOT NULL DEFAULT 'TERMIN',
    "qa2Label" TEXT NOT NULL DEFAULT 'Chat',
    "qa2Target" TEXT NOT NULL DEFAULT 'CHAT',
    "qa3Label" TEXT NOT NULL DEFAULT 'Sonstiges',
    "qa3Target" TEXT NOT NULL DEFAULT 'FORM_SONSTIGES',
    "fachrichtung" TEXT NOT NULL DEFAULT '',
    "introText" TEXT NOT NULL DEFAULT '',
    "formSteps" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceptionClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceptionLocation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Hauptstandort',
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReceptionLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceptionOpeningHours" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL DEFAULT '',
    "closeTime" TEXT NOT NULL DEFAULT '',
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ReceptionOpeningHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceptionNews" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceptionNews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReceptionClient_slug_key" ON "ReceptionClient"("slug");

-- CreateIndex
CREATE INDEX "ReceptionLocation_clientId_idx" ON "ReceptionLocation"("clientId");

-- CreateIndex
CREATE INDEX "ReceptionOpeningHours_locationId_idx" ON "ReceptionOpeningHours"("locationId");

-- CreateIndex
CREATE INDEX "ReceptionNews_clientId_idx" ON "ReceptionNews"("clientId");

-- AddForeignKey
ALTER TABLE "ReceptionLocation" ADD CONSTRAINT "ReceptionLocation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ReceptionClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionOpeningHours" ADD CONSTRAINT "ReceptionOpeningHours_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "ReceptionLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionNews" ADD CONSTRAINT "ReceptionNews_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ReceptionClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
