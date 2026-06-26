"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import type { Prisma } from "@/generated/prisma";
import type { LabelValue, MonthChannelRow, MonthStatusRow } from "@/lib/stat-report";

function asJson<T>(rows: T[]): Prisma.InputJsonValue {
  return rows as unknown as Prisma.InputJsonValue;
}

export async function createStatReport(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const user = await getCurrentUser();
  if (!user) return;

  const report = await prisma.statReport.create({
    data: { title, ownerId: user.id },
  });

  revalidatePath("/statistik/uebersicht");
  return report.id;
}

export async function deleteStatReport(id: string) {
  await prisma.statReport.delete({ where: { id } });
  revalidatePath("/statistik/uebersicht");
}

export interface StatReportInput {
  title: string;
  period: string;
  callCount: number;
  writtenCount: number;
  forwardCount: number;
  avgCallDuration: string;
  callDurationByMonth: LabelValue[];
  statusBreakdown: LabelValue[];
  topTags: LabelValue[];
  requestsByWeekday: LabelValue[];
  requestsByMonth: MonthStatusRow[];
  requestsByChannel: MonthChannelRow[];
  requestsByHour: LabelValue[];
  requestsByDay: LabelValue[];
}

export async function updateStatReport(id: string, data: StatReportInput) {
  await prisma.statReport.update({
    where: { id },
    data: {
      title: data.title.trim() || "Unbenannter Report",
      period: data.period,
      callCount: data.callCount,
      writtenCount: data.writtenCount,
      forwardCount: data.forwardCount,
      avgCallDuration: data.avgCallDuration,
      callDurationByMonth: asJson(data.callDurationByMonth),
      statusBreakdown: asJson(data.statusBreakdown),
      topTags: asJson(data.topTags),
      requestsByWeekday: asJson(data.requestsByWeekday),
      requestsByMonth: asJson(data.requestsByMonth),
      requestsByChannel: asJson(data.requestsByChannel),
      requestsByHour: asJson(data.requestsByHour),
      requestsByDay: asJson(data.requestsByDay),
    },
  });

  revalidatePath("/statistik/uebersicht");
  revalidatePath(`/statistik/${id}`);
  revalidatePath(`/statistik-print/${id}`);
}
