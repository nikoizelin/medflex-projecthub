-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "agentPhone" TEXT,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "pisSystem" TEXT,
ADD COLUMN     "transferNumber" TEXT,
ADD COLUMN     "useChat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "useFormular" BOOLEAN NOT NULL DEFAULT false;
