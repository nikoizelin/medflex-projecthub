/**
 * Schedule-Engine für die Projektplanung.
 * Portierung der Logik aus dem UI/UX-Mockup nach TypeScript.
 *
 * Wichtig: Sämtliche Tagesberechnungen (gap & dur) erfolgen in Werktagen
 * (Mo–Fr). Samstag und Sonntag gelten nicht als Arbeitstage.
 */

export interface ScheduleStepDefinition {
  name: string;
  /** Wartezeit in Werktagen nach dem Ende des vorherigen Schritts */
  gap?: number;
  /** Dauer des Schritts in Werktagen */
  dur?: number;
  /** Index eines vorherigen Schritts, dessen Startdatum übernommen wird */
  sameStartAs?: number;
  /** Index eines vorherigen Schritts, von dessen Start aus `gapFromStart` gerechnet wird */
  startFrom?: number;
  /** Werktage-Offset ab dem Startdatum von `startFrom` */
  gapFromStart?: number;
}

export interface ComputedScheduleStep {
  name: string;
  order: number;
  start: Date;
  end: Date;
}

export const PALETTE = [
  "#185FA5",
  "#993C1D",
  "#0F6E56",
  "#993556",
  "#534AB7",
  "#854F0B",
] as const;

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function nextWorkday(date: Date): Date {
  const result = new Date(date);
  while (isWeekend(result)) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

/**
 * Addiert `n` Werktage (Mo–Fr) auf `date`. Samstag/Sonntag werden übersprungen.
 * Bei n === 0 wird das Datum auf den nächsten Werktag verschoben, falls es
 * auf ein Wochenende fällt.
 */
export function addWorkdays(date: Date, n: number): Date {
  const result = new Date(date);
  if (n === 0) return nextWorkday(result);
  let added = 0;
  while (added < n) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) added++;
  }
  return result;
}

export function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Der 20-Schritte-Ablauf: Stabsübergabe → Finales Go-Live */
export const scheduleSteps: ScheduleStepDefinition[] = [
  { name: "Stabsübergabe", dur: 0 },
  { name: "Infobogen & Samples senden", dur: 0 },
  { name: "Account erstellen", gap: 3, dur: 7 },
  { name: "Telefonanbieter kontaktieren", gap: 2, dur: 0 },
  { name: "Anfragemodul-Meeting", gap: 1, dur: 0 },
  { name: "Kick-off (Projektstart)", gap: 3, dur: 0 },
  { name: "Erster Entwurf TA + ElevenLabs Konfiguration", dur: 14 },
  { name: "KI-Chat-Workflow erstellen", dur: 7, sameStartAs: 6 },
  { name: "Flyer erstellen", dur: 0, sameStartAs: 6 },
  { name: "Websiteentwurf & Telefonie-Abklärung", gap: 1, dur: 0 },
  { name: "Schulung durchführen", dur: 0, startFrom: 6, gapFromStart: 21 },
  { name: "Prompt-Feintuning & Testing", dur: 14 },
  { name: "Besprechung Testergebnisse", dur: 0 },
  { name: "Meeting Website-Anpassungen & Vertragsstart", gap: 1, dur: 0 },
  { name: "Testnummer versenden", gap: 3, dur: 0 },
  { name: "Testphase Kunde", dur: 7 },
  { name: "Erstes Go-Live", dur: 0, startFrom: 12, gapFromStart: 4 },
  { name: "Zweites Go-Live", gap: 3, dur: 0 },
  { name: "Drittes Go-Live", gap: 3, dur: 1 },
  { name: "Finales Go-Live", gap: 1, dur: 0 },
];

/** Berechnet alle 22 Schedule-Steps ausgehend vom gewählten Startdatum. */
export function calculateSchedule(startDate: Date): ComputedScheduleStep[] {
  const start = new Date(startDate);
  const computed: ComputedScheduleStep[] = [];

  scheduleSteps.forEach((s, i) => {
    let stepStart: Date;
    if (i === 0) {
      stepStart = nextWorkday(start);
    } else if (s.startFrom !== undefined) {
      stepStart = addWorkdays(computed[s.startFrom].start, s.gapFromStart ?? 0);
    } else if (s.sameStartAs !== undefined) {
      stepStart = new Date(computed[s.sameStartAs].start);
    } else {
      stepStart = addWorkdays(computed[i - 1].end, s.gap ?? 0);
    }
    const stepEnd = addWorkdays(stepStart, s.dur ?? 0);
    computed.push({ name: s.name, order: i, start: stepStart, end: stepEnd });
  });

  return computed;
}

/** Deadline = letztes Schedule-Step-Enddatum minus 1 Monat */
export function computeDeadline(steps: ComputedScheduleStep[]): Date {
  const lastEnd = steps.reduce(
    (latest, step) => (step.end > latest ? step.end : latest),
    steps[0].end
  );
  const deadline = new Date(lastEnd);
  deadline.setMonth(deadline.getMonth() - 1);
  return deadline;
}

/** Die 34 vordefinierten Checklisten-Punkte */
export const baseChecklist: string[] = [
  "Infobogen / Samples gesendet",
  "Infos erhalten",
  "Account erstellt",
  "TA auf ElevenLabs erstellt",
  "Termin für Kick-off geplant",
  "Kontakt mit Telefonanbieter aufgenommen",
  "Meeting zur Präsentation der Schriftlichkeit durchgeführt",
  "Kick-off durchgeführt",
  "Anfragetypen / Texte gesendet und bestätigt",
  "Agent auf ElevenLabs konfiguriert",
  "Erster TA gestartet",
  "KI-Chat-Workflow erstellt",
  "Erster Entwurf TA fertig + Knowledgebase",
  "Schulung geplant",
  "Testing TA gestartet",
  "Flyer erstellt",
  "Websiteentwurf erstellt",
  "FAQ / News / Hinweise erstellt",
  "Telefonie & Website fertiggestellt",
  "Schulung durchgeführt",
  "Pressekit / Flyer versendet",
  "Prompt-Feintuning abgeschlossen",
  "Testanfragemodul & KI-Chat versendet",
  "Testnummer versendet",
  "Terminfunktion Website implementiert",
  "Schriftverkehr gestartet",
  "Besprechung TA-Tests",
  "Erstes Go-Live geplant",
  "Zweites Go-Live geplant",
  "Drittes Go-Live geplant",
  "Finales Go-Live",
  "Monitoring",
  "Nachbesprechung nach einem Monat",
  "Statistikbesprechung",
];

/** Die 6 Phasen, denen die 34 Checklisten-Punkte zugeordnet werden */
export const PHASE_NAMES = [
  "Vorbereitung",
  "Setup",
  "Entwicklung",
  "Schulung",
  "Go-Live",
  "Monitoring",
] as const;

/**
 * `order`-Werte (Index in `baseChecklist`) der Checklisten-Punkte, die den
 * Übergang in die jeweils nächste Phase auslösen. `null` für die erste Phase,
 * die immer aktiv startet.
 *
 * - Setup: "Account erstellt" (order 2)
 * - Entwicklung: "Kick-off durchgeführt" (order 7)
 * - Schulung: "Schulung geplant" (order 13)
 * - Go-Live: "Besprechung TA-Tests" (order 26)
 * - Monitoring: "Finales Go-Live" (order 30)
 */
export const PHASE_TRIGGER_ORDERS: (number | null)[] = [null, 2, 7, 13, 26, 30];

/**
 * Ermittelt den Index der aktiven Phase anhand der abgehakten Checklisten-Punkte
 * (gebunden an feste `order`-Werte, unabhängig von der Gesamtzahl der Punkte).
 */
export function getActivePhaseIndex(
  checklist: { order: number; checked: boolean }[]
): number {
  let active = 0;
  for (let i = PHASE_TRIGGER_ORDERS.length - 1; i >= 1; i--) {
    const triggerOrder = PHASE_TRIGGER_ORDERS[i];
    if (triggerOrder !== null && checklist.some((c) => c.order === triggerOrder && c.checked)) {
      active = i;
      break;
    }
  }
  return active;
}
