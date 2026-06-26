import { notFound } from "next/navigation";
import { getStatReportData } from "@/lib/stat-report-server";
import { StatistikBuilder } from "./statistik-builder";

export default async function StatistikDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getStatReportData(id);
  if (!data) notFound();

  return <StatistikBuilder initialData={data} />;
}
