-- CreateTable
CREATE TABLE "StatReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "period" TEXT NOT NULL DEFAULT '',
    "callCount" INTEGER NOT NULL DEFAULT 0,
    "writtenCount" INTEGER NOT NULL DEFAULT 0,
    "forwardCount" INTEGER NOT NULL DEFAULT 0,
    "avgCallDuration" TEXT NOT NULL DEFAULT '',
    "popularCallTime" TEXT NOT NULL DEFAULT '',
    "callDurationByMonth" JSONB NOT NULL DEFAULT '[]',
    "statusBreakdown" JSONB NOT NULL DEFAULT '[]',
    "topTags" JSONB NOT NULL DEFAULT '[]',
    "requestsByWeekday" JSONB NOT NULL DEFAULT '[]',
    "requestsByMonth" JSONB NOT NULL DEFAULT '[]',
    "requestsByChannel" JSONB NOT NULL DEFAULT '[]',
    "requestsByHour" JSONB NOT NULL DEFAULT '[]',
    "requestsByDay" JSONB NOT NULL DEFAULT '[]',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StatReport_ownerId_idx" ON "StatReport"("ownerId");

-- AddForeignKey
ALTER TABLE "StatReport" ADD CONSTRAINT "StatReport_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
