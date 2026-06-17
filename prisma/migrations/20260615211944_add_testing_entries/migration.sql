-- CreateTable
CREATE TABLE "TestingEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL DEFAULT '',
    "issue" TEXT NOT NULL DEFAULT '',
    "comment" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestingEntry_projectId_idx" ON "TestingEntry"("projectId");

-- AddForeignKey
ALTER TABLE "TestingEntry" ADD CONSTRAINT "TestingEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
