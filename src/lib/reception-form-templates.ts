export type FieldType = "text" | "textarea" | "select" | "radio" | "date" | "time" | "number" | "medication_list";

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

export interface FormType {
  id: string;
  title: string;
  icon: string;
  steps: FormStep[];
}

export interface FormTemplate {
  id: string;
  label: string;
  icon: string;
  steps: FormStep[];
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "termin-anfragen",
    label: "Termin vereinbaren",
    icon: "calendar",
    steps: [
      {
        id: uid(), title: "Termingrund", subtitle: "Was ist der Grund Ihres Besuchs?",
        fields: [
          { id: "terminart", type: "radio", label: "Terminart", required: true,
            options: ["Erstberatung", "Kontrolltermin", "Impfung", "Sonstiges"] },
        ],
      },
      {
        id: uid(), title: "Wunschtermin",
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
    icon: "calendar-edit",
    steps: [
      {
        id: uid(), title: "Bestehender Termin",
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
    icon: "calendar-x",
    steps: [
      {
        id: uid(), title: "Terminabsage",
        fields: [
          { id: "datum", type: "date", label: "Datum des abzusagenden Termins", required: true },
          { id: "neuer-termin", type: "radio", label: "Neuen Termin gewünscht?", required: false,
            options: ["Ja, bitte kontaktieren Sie mich", "Nein"] },
        ],
      },
    ],
  },
  {
    id: "rezept-anfordern",
    label: "Rezept anfordern",
    icon: "file-text",
    steps: [
      {
        id: uid(), title: "Rezeptanfrage",
        fields: [
          { id: "medikament", type: "textarea", label: "Medikament / Präparat", placeholder: "Name, Dosierung …", required: true },
          { id: "abholung", type: "radio", label: "Gewünschte Zustellung", required: true,
            options: ["Abholung in der Praxis", "Per Post", "E-Rezept (falls verfügbar)"] },
        ],
      },
    ],
  },
  {
    id: "bericht-anfordern",
    label: "Bericht anfordern",
    icon: "clipboard",
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
    icon: "file-check",
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
    icon: "alert-circle",
    steps: [
      {
        id: uid(), title: "Notfallmeldung",
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
    icon: "pill",
    steps: [
      {
        id: uid(), title: "Medikamentenliste",
        fields: [
          { id: "medikamente", type: "medication_list", label: "Medikamente", required: true },
          { id: "abholung", type: "radio", label: "Abholung", required: true,
            options: ["Praxis", "Apotheke (Adresse im Kommentar angeben)"] },
        ],
      },
    ],
  },
  {
    id: "sonstiges",
    label: "Sonstiges",
    icon: "more-horizontal",
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
