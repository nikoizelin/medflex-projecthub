"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, FileDown, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { updateStatReport } from "../actions";
import { EditableTable } from "./editable-table";
import { MonthSeriesTable, type SeriesColumn } from "./month-series-table";
import { DashboardView } from "./dashboard-view";
import { ScreenshotImport } from "./screenshot-import";
import type {
  ExtractedStats,
  LabelValue,
  MonthChannelRow,
  MonthStatusRow,
  StatReportData,
} from "@/lib/stat-report";

const STATUS_COLUMNS: SeriesColumn<MonthStatusRow>[] = [
  { key: "vollstaendig", label: "Vollständig" },
  { key: "unvollstaendig", label: "Unvollständig" },
  { key: "abgebrochen", label: "Abgebrochen" },
];

const CHANNEL_COLUMNS: SeriesColumn<MonthChannelRow>[] = [
  { key: "telefon", label: "Telefon" },
  { key: "chat", label: "Chat" },
  { key: "kontaktseite", label: "Kontaktseite" },
];

/** Füllt fixe Zeilen (Status/Wochentag/Stunde) anhand des Labels oder per Index (Top Tags). */
function mergeFixedRows(
  current: LabelValue[],
  extracted: LabelValue[] | undefined,
  matchByLabel: boolean
): LabelValue[] {
  if (!extracted || extracted.length === 0) return current;
  if (!matchByLabel) {
    return current.map((row, i) => (extracted[i] ? { ...row, value: extracted[i].value } : row));
  }
  return current.map((row) => {
    const match = extracted.find((e) => e.label.trim().toLowerCase() === row.label.trim().toLowerCase());
    return match ? { ...row, value: match.value } : row;
  });
}

function ReviewHint({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="ml-1.5 text-[11px] font-normal text-amber-600">
      · aus Screenshot, bitte prüfen
    </span>
  );
}

export function StatistikBuilder({ initialData }: { initialData: StatReportData }) {
  const [data, setData] = useState(initialData);
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof StatReportData>(key: K, value: StatReportData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setAutoFilled((s) => {
      if (!s.has(key)) return s;
      const next = new Set(s);
      next.delete(key);
      return next;
    });
  };

  const applyImport = (extracted: ExtractedStats) => {
    setData((d) => ({
      ...d,
      period: extracted.period ?? d.period,
      callCount: extracted.callCount ?? d.callCount,
      writtenCount: extracted.writtenCount ?? d.writtenCount,
      forwardCount: extracted.forwardCount ?? d.forwardCount,
      avgCallDuration: extracted.avgCallDuration ?? d.avgCallDuration,
      callDurationByMonth: extracted.callDurationByMonth ?? d.callDurationByMonth,
      topTags: mergeFixedRows(d.topTags, extracted.topTags, false),
      requestsByDay: extracted.requestsByDay ?? d.requestsByDay,
    }));

    setAutoFilled((s) => new Set([...s, ...Object.keys(extracted)]));
  };

  const save = () => {
    startTransition(async () => {
      await updateStatReport(data.id, data);
      toast.success("Report gespeichert");
    });
  };

  const tagSum = data.topTags.reduce((s, r) => s + r.value, 0);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Link href="/statistik/uebersicht">
          <Button type="button" variant="outline" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <Input
          value={data.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Kundenname"
          className="max-w-60 font-medium"
        />
        <Input
          value={data.period}
          onChange={(e) => set("period", e.target.value)}
          placeholder="Zeitraum, z. B. Mai 2026"
          className="max-w-52"
        />
        <ReviewHint show={autoFilled.has("period")} />
        <div className="flex-1" />
        <ScreenshotImport onImport={applyImport} />
        <Link href={`/statistik-print/${data.id}`} target="_blank">
          <Button type="button" variant="outline">
            <FileDown className="size-4" />
            PDF exportieren
          </Button>
        </Link>
        <Button type="button" onClick={save} disabled={isPending}>
          <Save className="size-4" />
          Speichern
        </Button>
      </div>

      <Tabs defaultValue="eingabe">
        <TabsList>
          <TabsTrigger value="eingabe">Eingabe</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard-Vorschau</TabsTrigger>
        </TabsList>

        <TabsContent value="eingabe" className="mt-3 flex flex-col gap-5">
          <Section title="Kennzahlen">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Anzahl Anrufe" reviewFlag={autoFilled.has("callCount")}>
                <Input
                  type="number"
                  value={data.callCount}
                  onChange={(e) => set("callCount", Number(e.target.value))}
                />
              </Field>
              <Field label="Anzahl Schriftverkehr" reviewFlag={autoFilled.has("writtenCount")}>
                <Input
                  type="number"
                  value={data.writtenCount}
                  onChange={(e) => set("writtenCount", Number(e.target.value))}
                />
              </Field>
              <Field label="Anzahl Weiterleitungen" reviewFlag={autoFilled.has("forwardCount")}>
                <Input
                  type="number"
                  value={data.forwardCount}
                  onChange={(e) => set("forwardCount", Number(e.target.value))}
                />
              </Field>
              <Field label="Ø Anrufzeit" reviewFlag={autoFilled.has("avgCallDuration")}>
                <Input
                  value={data.avgCallDuration}
                  onChange={(e) => set("avgCallDuration", e.target.value)}
                  placeholder="z. B. 4:32 min"
                />
              </Field>
            </div>
          </Section>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Section title="Gesamtdauer der Anrufe" reviewFlag={autoFilled.has("callDurationByMonth")}>
              <EditableTable
                rows={data.callDurationByMonth}
                onChange={(rows) => set("callDurationByMonth", rows)}
                labelHeader="Monat"
                valueHeader="Minuten"
              />
            </Section>

            <Section title="Anfragen nach Status" reviewFlag={autoFilled.has("statusBreakdown")}>
              <EditableTable
                rows={data.statusBreakdown}
                onChange={(rows) => set("statusBreakdown", rows)}
                labelHeader="Status"
                valueHeader="Anzahl"
                fixedLabels
              />
            </Section>

            <Section title="Top Tags" reviewFlag={autoFilled.has("topTags")}>
              <EditableTable
                rows={data.topTags}
                onChange={(rows) => set("topTags", rows)}
                labelHeader="Tag"
                valueHeader="Anteil"
                valueSuffix="%"
                allowAddRemove={false}
              />
              <p
                className={cn(
                  "mt-1.5 text-xs",
                  tagSum === 100 ? "text-muted-foreground" : "font-medium text-destructive"
                )}
              >
                Summe: {tagSum}% {tagSum !== 100 && "(sollte 100% ergeben)"}
              </p>
            </Section>

            <Section title="Anfragen nach Wochentag" reviewFlag={autoFilled.has("requestsByWeekday")}>
              <EditableTable
                rows={data.requestsByWeekday}
                onChange={(rows) => set("requestsByWeekday", rows)}
                labelHeader="Wochentag"
                valueHeader="Anrufe"
                fixedLabels
              />
            </Section>

            <Section
              title="Anfragen nach Status pro Monat"
              className="lg:col-span-2"
              reviewFlag={autoFilled.has("requestsByMonth")}
            >
              <MonthSeriesTable
                rows={data.requestsByMonth}
                onChange={(rows) => set("requestsByMonth", rows)}
                columns={STATUS_COLUMNS}
                emptyRow={{ month: "", vollstaendig: 0, unvollstaendig: 0, abgebrochen: 0 }}
              />
            </Section>

            <Section
              title="Anfragen nach Kanal pro Monat"
              className="lg:col-span-2"
              reviewFlag={autoFilled.has("requestsByChannel")}
            >
              <MonthSeriesTable
                rows={data.requestsByChannel}
                onChange={(rows) => set("requestsByChannel", rows)}
                columns={CHANNEL_COLUMNS}
                emptyRow={{ month: "", telefon: 0, chat: 0, kontaktseite: 0 }}
              />
            </Section>

            <Section
              title="Patientenanfragen nach Tageszeit (06–19 Uhr)"
              reviewFlag={autoFilled.has("requestsByHour")}
            >
              <div className="max-h-72 pb-4">
                <EditableTable
                  rows={data.requestsByHour}
                  onChange={(rows) => set("requestsByHour", rows)}
                  labelHeader="Uhrzeit"
                  valueHeader="Anfragen"
                  fixedLabels
                />
              </div>
            </Section>

            <Section title="Anfragen nach Schlagwort" reviewFlag={autoFilled.has("requestsByDay")}>
              <EditableTable
                rows={data.requestsByDay}
                onChange={(rows) => set("requestsByDay", rows)}
                labelHeader="Schlagwort"
                valueHeader="Anfragen"
              />
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Vorschau im Originalformat (A4 quer) – horizontal scrollbar. Für den finalen Export
            &quot;PDF exportieren&quot; oben verwenden.
          </p>
          <div className="overflow-auto rounded-lg border bg-muted/30 p-4">
            <div className="mx-auto" style={{ width: "297mm", height: "210mm" }}>
              <DashboardView data={data} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Section({
  title,
  children,
  className,
  reviewFlag,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  reviewFlag?: boolean;
}) {
  return (
    <div className={className}>
      <p className="mb-2 text-sm font-medium">
        {title}
        <ReviewHint show={!!reviewFlag} />
      </p>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  reviewFlag,
}: {
  label: string;
  children: React.ReactNode;
  reviewFlag?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {label}
        <ReviewHint show={!!reviewFlag} />
      </Label>
      {children}
    </div>
  );
}
