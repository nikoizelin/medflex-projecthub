import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { StatistikOverview } from "./statistik-overview";

export default async function StatistikUebersichtPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const reports = await prisma.statReport.findMany({
    where: { ownerId: user.id },
    select: { id: true, title: true, period: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const data = reports.map((r) => ({
    id: r.id,
    title: r.title,
    period: r.period,
    updatedAt: r.updatedAt.toISOString(),
  }));

  return <StatistikOverview reports={data} />;
}
