-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "mainPhone" TEXT,
ADD COLUMN     "manualPhase" TEXT;

-- CreateTable
CREATE TABLE "MonitoringAlert" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitoringAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonitoringAlert_projectId_idx" ON "MonitoringAlert"("projectId");

-- CreateIndex
CREATE INDEX "MonitoringAlert_sentAt_idx" ON "MonitoringAlert"("sentAt" DESC);

-- AddForeignKey
ALTER TABLE "MonitoringAlert" ADD CONSTRAINT "MonitoringAlert_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
