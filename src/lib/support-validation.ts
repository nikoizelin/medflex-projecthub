// Gemeinsame Validierung für das Supportformular (Client für schnelles Feedback, Server als eigentliche Absicherung)

const HTML_TAG = /<\s*\/?\s*[a-zA-Z!?]/;
const SCRIPT_URL = /(javascript|vbscript)\s*:|data\s*:\s*text\/html/i;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const NAME_CHARS = /^[\p{L}\p{M}\p{N} .,'’&()/+\-–]+$/u;
const EMAIL = /^[^\s@<>"',;()\\]+@[^\s@<>"',;()\\]+\.[^\s@<>"',;()\\]{2,}$/;

export const MAX = { name: 200, email: 300, link: 500, text: 10000, entries: 10 };

function text(label: string, value: string, max: number, required: boolean): string | null {
  const v = value ?? "";
  if (required && !v.trim()) return `${label}: Bitte ausfüllen.`;
  if (v.length > max) return `${label}: Maximal ${max} Zeichen erlaubt.`;
  if (CONTROL_CHARS.test(v)) return `${label}: Enthält ungültige Steuerzeichen.`;
  if (HTML_TAG.test(v) || SCRIPT_URL.test(v)) return `${label}: HTML-Code oder Skripte sind nicht erlaubt.`;
  return null;
}

export function validateContact(c: { kontaktperson: string; praxisKunde: string; email: string }): string | null {
  for (const [label, value] of [["Name Kontaktperson", c.kontaktperson], ["Praxis / Kunde", c.praxisKunde]] as const) {
    const err = text(label, value, MAX.name, true);
    if (err) return err;
    if (!NAME_CHARS.test(value.trim())) return `${label}: Enthält nicht erlaubte Zeichen.`;
  }
  const mailErr = text("E-Mail", c.email, MAX.email, true);
  if (mailErr) return mailErr;
  if (!EMAIL.test(c.email.trim())) return "E-Mail: Bitte eine gültige E-Mail-Adresse eingeben.";
  return null;
}

export function validateEntry(
  e: {
    datum: string;
    beschreibungProblem: string;
    linkAnfrage: string;
    fehlerhaftesVerhalten: string;
    erwartesVerhalten: string;
  },
  nr: number
): string | null {
  const p = `Eintrag ${nr}`;
  const checks = [
    text(`${p} – Beschreibung`, e.beschreibungProblem, MAX.text, true),
    text(`${p} – Fehlerhaftes Verhalten`, e.fehlerhaftesVerhalten, MAX.text, false),
    text(`${p} – Erwartetes Verhalten`, e.erwartesVerhalten, MAX.text, false),
    text(`${p} – Link`, e.linkAnfrage, MAX.link, false),
  ];
  const first = checks.find(Boolean);
  if (first) return first;

  if (e.linkAnfrage.trim()) {
    try {
      const u = new URL(e.linkAnfrage.trim());
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
    } catch {
      return `${p} – Link: Bitte eine gültige Adresse (https://…) eingeben.`;
    }
  }
  if (e.datum && (!/^\d{4}-\d{2}-\d{2}$/.test(e.datum) || isNaN(new Date(e.datum).getTime()))) {
    return `${p} – Datum: Ungültiges Datum.`;
  }
  return null;
}

export function validateRequest(
  contact: { kontaktperson: string; praxisKunde: string; email: string },
  entries: Parameters<typeof validateEntry>[0][],
  consent: boolean
): string | null {
  const contactErr = validateContact(contact);
  if (contactErr) return contactErr;
  if (!entries.length) return "Bitte mindestens einen Eintrag erfassen.";
  if (entries.length > MAX.entries) return `Maximal ${MAX.entries} Einträge pro Anfrage.`;
  for (let i = 0; i < entries.length; i++) {
    const err = validateEntry(entries[i], i + 1);
    if (err) return err;
  }
  if (!consent) return "Bitte bestätigen Sie die Datenschutzerklärung.";
  return null;
}
