export interface LabelValue {
  label: string;
  value: number;
}

export interface MonthStatusRow {
  month: string;
  vollstaendig: number;
  unvollstaendig: number;
  abgebrochen: number;
}

export interface MonthChannelRow {
  month: string;
  telefon: number;
  chat: number;
  kontaktseite: number;
}

export interface StatReportData {
  id: string;
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

export const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
export const CHANNELS = ["Telefon", "Chat", "Kontaktseite"];
export const STATUS_LABELS = ["Vollständig", "Unvollständig", "Abgebrochen"];
/** Tageszeit-Tabelle/-Chart auf die Praxis-Öffnungszeiten begrenzt (06:00–19:00 Uhr) */
export const HOURS = Array.from({ length: 14 }, (_, i) => `${i + 6}:00`);
export const TOP_TAGS_ROW_COUNT = 7;

export function emptyRows(labels: string[]): LabelValue[] {
  return labels.map((label) => ({ label, value: 0 }));
}

export function emptyMonthStatusRows(count = 6): MonthStatusRow[] {
  return Array.from({ length: count }, () => ({
    month: "",
    vollstaendig: 0,
    unvollstaendig: 0,
    abgebrochen: 0,
  }));
}

export function emptyMonthChannelRows(count = 6): MonthChannelRow[] {
  return Array.from({ length: count }, () => ({
    month: "",
    telefon: 0,
    chat: 0,
    kontaktseite: 0,
  }));
}

/** Markenfarben (nur Blautöne, abgeleitet von #064b91) für Diagramme mit mehreren Kategorien */
export const CHART_COLORS = [
  "#064b91",
  "#1f6fc4",
  "#3684ec",
  "#38b6ff",
  "#5dade2",
  "#0a3d75",
  "#9fd3f5",
];

/**
 * Teilweises Ergebnis der Screenshot-Extraktion – nur sicher erkannte Felder sind gesetzt.
 * Bewusst nur Werte, die im Screenshot als Text/Zahl aufgedruckt sind (KPI-Kacheln, Tabellen,
 * Balken/Pie mit Wertbeschriftung) – reine Linien-/Flächendiagramme ohne aufgedruckte Werte
 * werden nicht extrahiert, da sich deren Werte nur ungenau aus der Kurvenform schätzen liessen.
 */
export interface ExtractedStats {
  period?: string;
  callCount?: number;
  writtenCount?: number;
  forwardCount?: number;
  avgCallDuration?: string;
  callDurationByMonth?: LabelValue[];
  topTags?: LabelValue[];
  requestsByDay?: LabelValue[];
}

export function toJsonRows(rows: LabelValue[]): LabelValue[] {
  return rows.filter((r) => r.label.trim() !== "");
}

/** Rundet min/max der Werte auf 100er-Schritte für eine ruhige Achsenbeschriftung */
export function roundedDomain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 100];
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const roundedMin = Math.floor(min / 100) * 100;
  const roundedMax = Math.max(Math.ceil(max / 100) * 100, roundedMin + 100);
  return [roundedMin, roundedMax];
}

/** Summiert eine Monats-Tabelle (Status oder Kanal) zu Gesamtwerten je Spalte, ohne 0-Werte. */
export function sumMonthColumns<T>(rows: T[], columns: { key: keyof T; label: string }[]): LabelValue[] {
  return columns
    .map((c) => ({
      label: c.label,
      value: rows.reduce((sum, r) => sum + (Number(r[c.key]) || 0), 0),
    }))
    .filter((r) => r.value > 0);
}
