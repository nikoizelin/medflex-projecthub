import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCurrentUser } from "@/lib/current-user";

const PROMPT = `Dieser Screenshot stammt aus dem Statistik-Tool "Elastic" und zeigt immer dasselbe Dashboard-Layout mit mehreren Panels. Extrahiere die Werte und übergib sie an das Tool "submit_extracted_stats".

WICHTIG: Nutze NUR Panels, deren Werte als Text/Zahl direkt im Bild aufgedruckt sind (KPI-Kacheln, Tabellen, Balken-/Kreisdiagramme MIT aufgedruckter Wertbeschriftung). Ignoriere reine Linien- oder Flächendiagramme ohne aufgedruckte Werte (z. B. "Anzahl Patientenanfragen über die Telefonassistenten", "Patientenanfragen pro Wochentag", "Patientenanfragen nach Tageszeit", "Anzahl Minuten im Telefonassistent pro Monat", "Patientenanfragen nach Kanal") – deren Werte lassen sich nur ungenau aus der Kurvenform schätzen und sollen NICHT extrahiert werden.

Ordne wie folgt zu:

- "Erste berücksichtigte Patientenanfrage" + "Letzte berücksichtigte Patientenanfrage" (Text-Kacheln) → period als "TT.MM.JJJJ – TT.MM.JJJJ".
- "Telefon / Anzahl Anfragen" (Text-Kachel) → callCount. "Schriftlich / Anzahl Anfragen" (Text-Kachel) → writtenCount.
- "Durchschnittliche Dauer von Telefonaten" (Text-Kachel, in seconds) → avgCallDuration, umgerechnet ins Format "m:ss min".
- "Gesamtdauer aller Telefonate pro Monat" (Tabelle mit Spalten "@timestamp per month" / "LLM Minuten" – eine echte Tabelle, kein Diagramm) → callDurationByMonth als [{label: Monatsname, value: Minuten}]. Monat als kurzer Name (z. B. "Okt 2025").
- "Prozentuale Anzahl Patientenanfragen nach Typ" (Balkendiagramm, Prozentwert ist auf jedem Balken aufgedruckt) → topTags als [{label, value}], value = die aufgedruckte Prozentzahl (ohne %-Zeichen), maximal 7 Einträge.
- "Anzahl Anfragen per Telefon oder Chat nach Tags" (horizontales Balkendiagramm, Wert ist auf jedem Balken aufgedruckt) → requestsByDay als [{label, value}] mit allen sichtbaren Balken/aufgedruckten Werten. Zusätzlich: der aufgedruckte Wert des Balkens "Weiterleitung" aus diesem Chart → forwardCount.

Das Panel "Eingang Patientenanfragen" (Kreisdiagramm Telefon/Chat/Kontaktseite) ignorierst du, da es nur Gesamt-Prozentwerte ohne Monatsaufschlüsselung zeigt und dafür kein Feld existiert.

Gib nur Felder/Zeilen zurück, die im Screenshot klar lesbar sind. Lass unklare oder nicht vorhandene Werte einfach weg, anstatt zu raten. Tausendertrennzeichen (Leerzeichen/Punkte) bei Zahlen entfernen, z. B. "18 569" → 18569.`;

const labelValueSchema = {
  type: "array" as const,
  items: {
    type: "object" as const,
    properties: {
      label: { type: "string" },
      value: { type: "number" },
    },
    required: ["label", "value"],
  },
};

const EXTRACTION_TOOL = {
  name: "submit_extracted_stats",
  description: "Übermittelt die aus dem Elastic-Statistik-Screenshot extrahierten Werte.",
  input_schema: {
    type: "object" as const,
    properties: {
      period: { type: "string" },
      callCount: { type: "number" },
      writtenCount: { type: "number" },
      forwardCount: { type: "number" },
      avgCallDuration: { type: "string" },
      callDurationByMonth: labelValueSchema,
      topTags: labelValueSchema,
      requestsByDay: labelValueSchema,
    },
    required: [],
  },
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY ist nicht konfiguriert." }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei erhalten." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mediaType = file.type || "image/png";
  const isPdf = mediaType === "application/pdf";

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: "tool", name: "submit_extracted_stats" },
      messages: [
        {
          role: "user",
          content: [
            isPdf
              ? {
                  type: "document",
                  source: { type: "base64", media_type: "application/pdf", data: base64 },
                }
              : {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
                    data: base64,
                  },
                },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json({ error: "Keine Daten aus der Datei extrahiert." }, { status: 422 });
    }

    return NextResponse.json(toolUse.input);
  } catch (err) {
    console.error("Statistik-Extraktion fehlgeschlagen:", err);
    return NextResponse.json({ error: "Extraktion fehlgeschlagen." }, { status: 500 });
  }
}
