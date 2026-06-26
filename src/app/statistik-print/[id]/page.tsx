import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getStatReportData } from "@/lib/stat-report-server";
import { DashboardView } from "../../statistik/[id]/dashboard-view";
import { PrintButton } from "./print-button";

export default async function StatistikPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const data = await getStatReportData(id);
  if (!data) notFound();

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-muted/40 p-6 print:bg-white print:p-0">
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @media print {
          html, body { background: white; }
        }
      `}</style>

      <PrintButton />

      <div
        className="overflow-hidden rounded-lg shadow-lg print:rounded-none print:shadow-none"
        style={{ width: "297mm", height: "210mm" }}
      >
        <DashboardView data={data} />
      </div>
    </div>
  );
}
