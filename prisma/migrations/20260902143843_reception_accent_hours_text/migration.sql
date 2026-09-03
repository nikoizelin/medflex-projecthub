-- AlterTable
ALTER TABLE "ReceptionClient" ADD COLUMN     "accentColor" TEXT NOT NULL DEFAULT '#E30613';

-- AlterTable
ALTER TABLE "ReceptionLocation" ADD COLUMN     "openingHoursText" TEXT NOT NULL DEFAULT '';
