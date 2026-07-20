import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
  PageBreak,
} from "docx";
import { saveAs } from "file-saver";

export interface ExportEntry {
  kontaktperson: string;
  praxisKunde: string;
  email: string;
  datum: string;
  kategorie: string;
  prioritaet: string;
  beschreibungProblem: string;
  linkAnfrage: string;
  fehlerhaftesVerhalten: string;
  erwartesVerhalten: string;
  status: string;
  kommentar: string;
}

const BRAND = "#064b91";
const LABEL_BG = "F1F5F9";
const COMMENT_BG = "FEF9C3";
const CELL_W = 9360;
const LABEL_W = 2400;
const VALUE_W = CELL_W - LABEL_W;

const KATEGORIE_LABEL: Record<string, string> = {
  telefonassistent: "Telefonassistent",
  "medflex-app": "MedFlex App",
  sonstiges: "Sonstiges",
  featurewunsch: "Featurewunsch",
};

const PRIORITY_LABEL: Record<string, string> = {
  kritisch: "Kritisch",
  hoch: "Hoch",
  mittel: "Mittel",
  niedrig: "Niedrig",
};

const border = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
};

function labelCell(text: string): TableCell {
  return new TableCell({
    width: { size: LABEL_W, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, color: "auto", fill: LABEL_BG },
    borders: border,
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 18, bold: true, color: "64748B" })],
        spacing: { before: 60, after: 60 },
      }),
    ],
  });
}

function valueCell(text: string, highlight = false): TableCell {
  return new TableCell({
    width: { size: VALUE_W, type: WidthType.DXA },
    shading: highlight
      ? { type: ShadingType.CLEAR, color: "auto", fill: COMMENT_BG }
      : undefined,
    borders: border,
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text || "—",
            size: 20,
            color: highlight ? "92400E" : "0F172A",
            bold: highlight,
          }),
        ],
        spacing: { before: 60, after: 60 },
      }),
    ],
  });
}

function row(label: string, value: string, highlight = false): TableRow {
  return new TableRow({ children: [labelCell(label), valueCell(value, highlight)] });
}

function entryTable(entry: ExportEntry): Table {
  const dateLabel = entry.datum
    ? new Date(entry.datum + "T00:00:00").toLocaleDateString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

  const rows = [
    row("Kontaktperson", entry.kontaktperson),
    row("Praxis / Kunde", entry.praxisKunde),
    row("E-Mail", entry.email),
    row("Datum", dateLabel),
    row("Kategorie", KATEGORIE_LABEL[entry.kategorie] ?? entry.kategorie),
    row("Priorität", PRIORITY_LABEL[entry.prioritaet] ?? entry.prioritaet),
    row("Status", entry.status.charAt(0).toUpperCase() + entry.status.slice(1)),
    row("Beschreibung des Problems", entry.beschreibungProblem),
    row("Link der Anfrage", entry.linkAnfrage),
    row("Fehlerhaftes Verhalten", entry.fehlerhaftesVerhalten),
    row("Erwartetes Verhalten", entry.erwartesVerhalten),
    row("Kommentar", entry.kommentar, true),
  ];

  return new Table({
    width: { size: CELL_W, type: WidthType.DXA },
    columnWidths: [LABEL_W, VALUE_W],
    rows,
  });
}

export async function generateChangeRequestDocx(entries: ExportEntry[]) {
  const now = new Date().toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const sections: (Paragraph | Table)[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: "MedFlex Schweiz AG",
          size: 28,
          bold: true,
          color: BRAND.replace("#", ""),
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Änderungsanfragen – Voice Agent Support", size: 22, color: "64748B" }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Erstellt am: ${now}`, size: 18, color: "94A3B8" })],
      spacing: { after: 300 },
    }),
  ];

  entries.forEach((entry, i) => {
    const titleText =
      [entry.praxisKunde, entry.kontaktperson].filter(Boolean).join(" · ") || `Eintrag ${i + 1}`;
    const kategorieText = KATEGORIE_LABEL[entry.kategorie] ?? entry.kategorie;

    sections.push(
      new Paragraph({
        text: `${i + 1}. ${titleText} — ${kategorieText}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: i === 0 ? 0 : 400, after: 160 },
      }),
      entryTable(entry)
    );

    if (i < entries.length - 1) {
      sections.push(new Paragraph({ children: [new PageBreak()] }));
    }
  });

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          run: { size: 24, bold: true, color: BRAND.replace("#", "") },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
        },
        children: sections,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `aenderungsanfragen_${new Date().toISOString().slice(0, 10)}.docx`);
}
