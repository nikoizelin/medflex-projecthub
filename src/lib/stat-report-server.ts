import { prisma } from "@/lib/prisma";
import {
  HOURS,
  STATUS_LABELS,
  TOP_TAGS_ROW_COUNT,
  WEEKDAYS,
  emptyMonthChannelRows,
  emptyMonthStatusRows,
  emptyRows,
  type LabelValue,
  type MonthChannelRow,
  type MonthStatusRow,
  type StatReportData,
} from "@/lib/stat-report";

function rows(json: unknown, fallbackLabels?: string[]): LabelValue[] {
  if (Array.isArray(json) && json.length > 0) return json as LabelValue[];
  return fallbackLabels ? emptyRows(fallbackLabels) : [];
}

function monthStatusRows(json: unknown): MonthStatusRow[] {
  if (Array.isArray(json) && json.length > 0) return json as MonthStatusRow[];
  return emptyMonthStatusRows();
}

function monthChannelRows(json: unknown): MonthChannelRow[] {
  if (Array.isArray(json) && json.length > 0) return json as MonthChannelRow[];
  return emptyMonthChannelRows();
}

export async function getStatReportData(id: string): Promise<StatReportData | null> {
  const report = await prisma.statReport.findUnique({ where: { id } });
  if (!report) return null;

  return {
    id: report.id,
    title: report.title,
    period: report.period,
    callCount: report.callCount,
    writtenCount: report.writtenCount,
    forwardCount: report.forwardCount,
    avgCallDuration: report.avgCallDuration,
    callDurationByMonth: rows(report.callDurationByMonth),
    statusBreakdown: rows(report.statusBreakdown, STATUS_LABELS),
    topTags: rows(report.topTags, Array(TOP_TAGS_ROW_COUNT).fill("")),
    requestsByWeekday: rows(report.requestsByWeekday, WEEKDAYS),
    requestsByMonth: monthStatusRows(report.requestsByMonth),
    requestsByChannel: monthChannelRows(report.requestsByChannel),
    requestsByHour: rows(report.requestsByHour, HOURS),
    requestsByDay: rows(report.requestsByDay),
  };
}
