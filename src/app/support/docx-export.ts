import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
} from "docx";
import { saveAs } from "file-saver";
import { KATEGORIE_LABEL } from "@/lib/constants";

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

const BRAND = "064b91";
const LABEL_BG = "F1F5F9";
const COMMENT_BG = "FEF9C3";
const CELL_W = 9360;
const LABEL_W = 2400;
const VALUE_W = CELL_W - LABEL_W;


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
        children: [new TextRun({ text, size: 18, bold: true, color: "64748B", font: "Arial" })],
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
            font: "Arial",
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

function contactTable(entry: ExportEntry): Table {
  return new Table({
    width: { size: CELL_W, type: WidthType.DXA },
    columnWidths: [LABEL_W, VALUE_W],
    rows: [
      row("Kontaktperson", entry.kontaktperson),
      row("Praxis / Kunde", entry.praxisKunde),
      row("E-Mail", entry.email),
    ],
  });
}

function entryTable(entry: ExportEntry): Table {
  const dateLabel = entry.datum
    ? new Date(entry.datum + "T00:00:00").toLocaleDateString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

  const kat = entry.kategorie;

  const rows: TableRow[] = [
    row("Datum", dateLabel),
    row("Kategorie", KATEGORIE_LABEL[kat] ?? kat),
  ];

  if (kat === "featurewunsch") {
    rows.push(row("Feature Wunsch", entry.beschreibungProblem));
    if (entry.fehlerhaftesVerhalten) rows.push(row("Sonstiges", entry.fehlerhaftesVerhalten));
  } else if (kat === "sonstiges") {
    rows.push(row("Beschreibung", entry.beschreibungProblem));
  } else {
    rows.push(row("Beschreibung des Problems", entry.beschreibungProblem));
    if (kat !== "medflex-app" && entry.linkAnfrage) {
      rows.push(row("Link der Anfrage", entry.linkAnfrage));
    }
    if (entry.fehlerhaftesVerhalten) rows.push(row("Fehlerhaftes Verhalten", entry.fehlerhaftesVerhalten));
    if (entry.erwartesVerhalten) rows.push(row("Erwartetes Verhalten", entry.erwartesVerhalten));
  }

  rows.push(row("Kommentar", entry.kommentar, true));

  return new Table({
    width: { size: CELL_W, type: WidthType.DXA },
    columnWidths: [LABEL_W, VALUE_W],
    rows,
  });
}

export async function generateChangeRequestDocx(entries: ExportEntry[]) {
  if (!entries.length) return;

  const now = new Date().toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const first = entries[0];
  const praxisKunde = first.praxisKunde || "Kunde";

  const sections: (Paragraph | Table)[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: `${praxisKunde} Änderungsanfrage`,
          size: 28,
          bold: true,
          color: BRAND,
          font: "Arial",
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "MedFlex Schweiz AG – Voice Agent Support", size: 22, color: "64748B", font: "Arial" }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Erstellt am: ${now}`, size: 18, color: "94A3B8", font: "Arial" })],
      spacing: { after: 300 },
    }),
    new Paragraph({
      text: "Kontaktangaben",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 0, after: 160 },
    }),
    contactTable(first),
    new Paragraph({ spacing: { before: 240, after: 0 } }),
  ];

  entries.forEach((entry, i) => {
    const kategorieText = KATEGORIE_LABEL[entry.kategorie] ?? entry.kategorie;
    const titleText = entry.praxisKunde || `Eintrag ${i + 1}`;

    sections.push(
      new Paragraph({
        text: `${i + 1}. ${titleText} – ${kategorieText}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: i === 0 ? 0 : 320, after: 160 },
      }),
      entryTable(entry)
    );
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 20 },
        },
      },
      paragraphStyles: [
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          run: { size: 24, bold: true, color: BRAND, font: "Arial" },
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

  // Filename: Aenderungsanfrage_[Praxis/Kunde]_[dd-MM-YYYY]
  const dateParts = now.split(".");
  const dateStr = dateParts.length === 3 ? `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}` : now;
  const safeName = praxisKunde.replace(/[^a-zA-Z0-9äöüÄÖÜ]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  saveAs(blob, `Aenderungsanfrage_${safeName}_${dateStr}.docx`);
}
