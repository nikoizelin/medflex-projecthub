export type FieldType = "text" | "textarea" | "select" | "radio" | "date" | "time" | "number";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface FormStep {
  id: string;
  title: string;
  subtitle?: string;
  fields: FormField[];
}

export interface FormTemplate {
  id: string;
  label: string;
  steps: FormStep[];
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "termin-anfragen",
    label: "Termin vereinbaren",
    steps: [
      {
        id: uid(), title: "Art des Termins", subtitle: "Was ist der Grund Ihres Besuchs?",
        fields: [
          { id: "terminart", type: "radio", label: "Terminart", required: true,
            options: ["Erstberatung", "Kontrolltermin", "Impfung", "Sonstiges"] },
        ],
      },
      {
        id: uid(), title: "Wunschtermin", subtitle: "Wann möchten Sie kommen?",
        fields: [
          { id: "datum", type: "date", label: "Bevorzugtes Datum", required: true },
          { id: "uhrzeit", type: "select", label: "Bevorzugte Uhrzeit", required: false,
            options: ["Morgens (08:00–10:00)", "Vormittags (10:00–12:00)", "Nachmittags (13:00–17:00)"] },
          { id: "hinweis", type: "textarea", label: "Besondere Hinweise", placeholder: "z. B. Parkplatzbedarf, Rollstuhl …", required: false },
        ],
      },
    ],
  },
  {
    id: "termin-aendern",
    label: "Termin ändern",
    steps: [
      {
        id: uid(), title: "Bestehender Termin", subtitle: "Wann ist Ihr aktueller Termin?",
        fields: [
          { id: "alter-termin", type: "date", label: "Datum des bestehenden Termins", required: true },
          { id: "grund", type: "textarea", label: "Grund der Änderung", required: false },
        ],
      },
      {
        id: uid(), title: "Neuer Wunschtermin",
        fields: [
          { id: "neues-datum", type: "date", label: "Neues bevorzugtes Datum", required: true },
          { id: "neue-zeit", type: "select", label: "Bevorzugte Uhrzeit", required: false,
            options: ["Morgens (08:00–10:00)", "Vormittags (10:00–12:00)", "Nachmittags (13:00–17:00)"] },
        ],
      },
    ],
  },
  {
    id: "termin-absagen",
    label: "Termin absagen",
    steps: [
      {
        id: uid(), title: "Terminabsage",
        fields: [
          { id: "datum", type: "date", label: "Datum des abzusagenden Termins", required: true },
          { id: "grund", type: "select", label: "Grund der Absage", required: false,
            options: ["Krankheit", "Terminkonflikt", "Sonstiges"] },
          { id: "neuer-termin", type: "radio", label: "Neuen Termin gewünscht?", required: false,
            options: ["Ja, bitte kontaktieren Sie mich", "Nein"] },
        ],
      },
    ],
  },
  {
    id: "rezept-anfordern",
    label: "Rezept anfordern",
    steps: [
      {
        id: uid(), title: "Medikament", subtitle: "Welches Rezept benötigen Sie?",
        fields: [
          { id: "medikament", type: "textarea", label: "Medikament / Präparat", placeholder: "Name, Dosierung …", required: true },
          { id: "abholung", type: "radio", label: "Wie möchten Sie das Rezept erhalten?", required: true,
            options: ["Abholung in der Praxis", "Per Post", "E-Rezept (falls verfügbar)"] },
        ],
      },
    ],
  },
  {
    id: "bericht-anfordern",
    label: "Bericht anfordern",
    steps: [
      {
        id: uid(), title: "Berichtsanfrage",
        fields: [
          { id: "berichtstyp", type: "select", label: "Art des Berichts", required: true,
            options: ["Arztbericht", "Laborbericht", "Röntgenbericht", "Entlassungsbericht", "Sonstiges"] },
          { id: "zeitraum", type: "text", label: "Zeitraum / Datum der Behandlung", required: false },
          { id: "zweck", type: "textarea", label: "Zweck der Anfrage", required: false },
        ],
      },
    ],
  },
  {
    id: "au-zeugnis",
    label: "AU-Zeugnis anfordern",
    steps: [
      {
        id: uid(), title: "Arbeitsunfähigkeitszeugnis",
        fields: [
          { id: "von", type: "date", label: "Krankheitsbeginn", required: true },
          { id: "bis", type: "date", label: "Voraussichtlich bis (optional)", required: false },
          { id: "zustellung", type: "radio", label: "Zustellung", required: true,
            options: ["Abholung in der Praxis", "Per Post", "Elektronisch (wenn möglich)"] },
        ],
      },
    ],
  },
  {
    id: "notfall",
    label: "Notfall",
    steps: [
      {
        id: uid(), title: "Notfallmeldung", subtitle: "Bitte beschreiben Sie Ihre Symptome kurz.",
        fields: [
          { id: "symptome", type: "textarea", label: "Symptome / Beschwerden", required: true },
          { id: "seit", type: "text", label: "Seit wann bestehen die Beschwerden?", required: false },
          { id: "intensitaet", type: "radio", label: "Intensität", required: true,
            options: ["Mittel", "Stark", "Sehr stark / unerträglich"] },
        ],
      },
    ],
  },
  {
    id: "medikamentenbestellung",
    label: "Medikamentenbestellung",
    steps: [
      {
        id: uid(), title: "Bestellung",
        fields: [
          { id: "medikament", type: "textarea", label: "Medikament / Präparat", placeholder: "Name, Dosierung, Packungsgrösse …", required: true },
          { id: "menge", type: "number", label: "Menge (Packungen)", required: false },
          { id: "abholung", type: "radio", label: "Abholung", required: true,
            options: ["Praxis", "Apotheke (Adresse im Kommentar angeben)"] },
        ],
      },
    ],
  },
  {
    id: "sonstiges",
    label: "Sonstiges",
    steps: [
      {
        id: uid(), title: "Ihre Anfrage",
        fields: [
          { id: "betreff", type: "text", label: "Betreff", required: true },
          { id: "nachricht", type: "textarea", label: "Nachricht", placeholder: "Beschreiben Sie Ihr Anliegen …", required: true },
        ],
      },
    ],
  },
];
