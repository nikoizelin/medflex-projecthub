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
  "#E30613",
  "#BF375F",
  "#BC358C",
  "#7A368D",
  "#283585",
  "#4B7E9C",
  "#4BBDBF",
  "#00AA82",
  "#009740",
  "#80BA27",
  "#C6D300",
  "#FFED00",
  "#F9AD00",
  "#F07D00",
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

/** Der 25-Schritte-Ablauf: Stabsübergabe → Finales GoLive */
export const scheduleSteps: ScheduleStepDefinition[] = [
  { name: "Stabsübergabe", dur: 0 },                                                //  0 – 1T
  { name: "Infobogen & Voice Samples senden", dur: 0 },                             //  1 – 1T
  { name: "Kickoff planen", dur: 0 },                                               //  2 – 1T
  { name: "Telefonanbieter kontaktieren", gap: 2, dur: 0 },                         //  3 – 2T nach Kickoff planen
  { name: "Account erstellen", startFrom: 1, gapFromStart: 5, dur: 7 },             //  4 – 1 Woche nach Infobogen, 8T Dauer
  { name: "Kickoff durchführen", dur: 0 },                                           //  5 – 1T
  { name: "Vorstellung schriftliche Kontaktmöglichkeiten", gap: 5, dur: 0 },         //  6 – 1 Woche nach Kickoff
  { name: "Erster Entwurf TA & KB erstellen + 11Labs konfigurieren", dur: 13 },     //  7 – 14T
  { name: "KI-Chat/Anfrageformular konfigurieren", dur: 5 },                        //  8 – 6T
  { name: "Websiteänderungen und Marketingmaterial entwerfen", dur: 0 },             //  9 – 1T
  { name: "FAQ + Chat-Testseite senden", dur: 0 },                                  // 10 – 1T
  { name: "Telefonieabklärungen und Aufsetzung", gap: 1, dur: 0 },                  // 11 – 1T nach FAQ & Marketing
  { name: "Schulungstermin planen", dur: 0 },                                        // 12 – 1T
  { name: "Logins und Accounts versenden", gap: 5, dur: 0 },                        // 13 – 1 Woche nach Schulungstermin
  { name: "Schulung durchführen", dur: 0 },                                           // 14 – 1T
  { name: "Prompt Finetuning und Finalisierung", dur: 3 },                           // 15 – 4T
  { name: "Testing durchführen", dur: 1 },                                            // 16 – 2T
  { name: "Start Schriftverkehr (Update Website)", dur: 0 },                          // 17 – 1T
  { name: "Testnummer TA senden + Testphase", dur: 6 },                              // 18 – 7T
  { name: "Telefonie bei Kunden einrichten", dur: 0 },                               // 19 – 1T
  { name: "Besprechung der Tests durchführen & Terminierung 1. GoLive", dur: 0 },   // 20 – 1T
  { name: "1. GoLive + Nachbesprechung", dur: 1 },                                   // 21 – 2T
  { name: "2. GoLive + Nachbesprechung", dur: 1 },                                   // 22 – 2T
  { name: "3. GoLive + Nachbesprechung", dur: 1 },                                   // 23 – 2T
  { name: "Finales GoLive + Nachbesprechung", dur: 0 },                              // 24 – 1T
];

/** Berechnet alle Schedule-Steps ausgehend vom gewählten Startdatum. */
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

/** Deadline = letztes Schedule-Step-Enddatum */
export function computeDeadline(steps: ComputedScheduleStep[]): Date {
  return new Date(
    steps.reduce(
      (latest, step) => (step.end > latest ? step.end : latest),
      steps[0].end
    )
  );
}

/** Die 29 vordefinierten Checklisten-Punkte */
export const baseChecklist: string[] = [
  "Infobogen & Voice Samples senden",                                          //  0
  "Infobogen erhalten",                                                         //  1
  "Kickoff planen",                                                             //  2
  "Telefonanbieter kontaktieren",                                               //  3
  "Account erstellen",                                                          //  4  → Setup
  "Kickoff durchführen",                                                        //  5  → Entwicklung
  "Termin Vorstellung Kontaktmöglichkeiten planen",                             //  6
  "Vorstellung schriftliche Kontaktmöglichkeiten",                              //  7
  "Erster Entwurf TA & KB erstellen + 11Labs konfigurieren",                   //  8
  "KI-Chat/Anfrageformular konfigurieren",                                      //  9
  "Websiteänderungen und Marketingmaterial entwerfen",                          // 10
  "Telefonieabklärungen und Aufsetzung",                                        // 11
  "FAQ + Chat-Testseite senden",                                                // 12
  "Schulungstermin planen",                                                     // 13  → Schulung
  "Logins und Accounts versenden",                                              // 14
  "Schulung durchführen",                                                       // 15
  "Prompt Finetuning und Finalisierung",                                        // 16
  "Testing durchführen",                                                        // 17
  "Start Schriftverkehr (Update Website)",                                      // 18
  "Testnummer TA senden",                                                       // 19
  "Telefonie bei Kunden einrichten",                                            // 20
  "Besprechung der Tests durchführen & Terminierung 1. GoLive",                 // 21  → Go-Live
  "1. GoLive + Nachbesprechung",                                                // 22
  "2. GoLive + Nachbesprechung",                                                // 23
  "3. GoLive + Nachbesprechung",                                                // 24
  "Finales GoLive + Nachbesprechung",                                           // 25  → Monitoring
  "Erklärung Support",                                                          // 26
  "Nachbesprechung nach 1 Monat Laufzeit",                                      // 27
  "Fortlaufendes Monitoring",                                                   // 28
];

/** Die 6 Phasen, denen die 29 Checklisten-Punkte zugeordnet werden */
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
 * - Setup:      "Account erstellen"    (order 4)
 * - Entwicklung:"Kickoff durchführen"  (order 5)
 * - Schulung:   "Schulungstermin planen" (order 13)
 * - Go-Live:    "Besprechung der Tests & Terminierung 1. GoLive" (order 21)
 * - Monitoring: "Finales GoLive + Nachbesprechung" (order 25)
 */
export const PHASE_TRIGGER_ORDERS: (number | null)[] = [null, 4, 5, 13, 21, 25];

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
