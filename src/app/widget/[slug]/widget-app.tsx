"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Calendar, MessageCircle, MoreHorizontal, X, ChevronRight,
  ChevronLeft, Paperclip, Phone, Mail, User, Users,
  CheckCircle2, Clock, Newspaper, Mic, MicOff, Loader2,
  MapPin, ExternalLink,
} from "lucide-react";
import type { FormStep, FormField } from "@/lib/reception-form-templates";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OpeningHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
  note: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  isDefault: boolean;
  openingHours: OpeningHour[];
}

export interface WidgetConfig {
  id: string;
  slug: string;
  name: string;
  logoPath: string;
  widgetTitle: string;
  widgetSubtitle: string;
  defaultCountryCode: string;
  elevenLabsAgentId: string;
  privacyPolicyText: string;
  privacyPolicyUrl: string;
  qa1Label: string; qa1Target: string;
  qa2Label: string; qa2Target: string;
  qa3Label: string; qa3Target: string;
  fachrichtung: string;
  introText: string;
  formSteps: FormStep[];
  locations: Location[];
  news: { id: string; title: string; body: string }[];
}

type WidgetView = "teaser" | "panel" | "collapsed";
type PanelTab = "startseite" | "formular" | "chat";
type ForSelf = "self" | "proxy";

const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

// ─── Styles (explicit light colours, iframe-safe) ─────────────────────────────

const S = {
  // container
  outer: "fixed bottom-5 right-5 flex flex-col items-end gap-2",
  // quick-action strip
  strip: "flex gap-1.5",
  qaBtn: "flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer",
  // teaser rectangle
  rect: "flex w-80 cursor-pointer items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-md hover:shadow-lg transition-shadow",
  // collapsed circle
  circle: "flex size-14 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white shadow-lg hover:shadow-xl transition-shadow",
  // panel
  panel: "flex w-80 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl",
  panelHeader: "flex items-center gap-2.5 border-b border-gray-100 px-4 py-3",
  tabBar: "flex border-b border-gray-100",
  tab: "flex-1 py-2.5 text-xs font-medium transition-colors",
  tabActive: "border-b-2 border-red-600 text-red-600",
  tabInactive: "text-gray-400 hover:text-gray-700",
  // overlay
  overlay: "fixed inset-0 flex items-end justify-end p-5",
  overlayCard: "w-80 rounded-2xl border border-gray-200 bg-white p-5 shadow-xl",
  // buttons
  btn: "w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors",
  btnOutline: "w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors",
  btnSm: "rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors",
  btnSmOutline: "rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors",
  // form
  input: "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100",
  label: "block text-xs font-medium text-gray-700 mb-1",
  // misc
  muted: "text-xs text-gray-400",
};

// ─── Privacy Overlay ──────────────────────────────────────────────────────────

function PrivacyOverlay({ config, onAccept }: { config: WidgetConfig; onAccept: () => void }) {
  return (
    <div className={S.overlay} style={{ pointerEvents: "auto" }}>
      <div className={S.overlayCard}>
        <div className="mb-3 flex items-center gap-2.5">
          {config.logoPath ? (
            <img src={config.logoPath} alt={config.name} className="size-8 rounded-lg object-contain" />
          ) : (
            <div className="flex size-8 items-center justify-center rounded-lg bg-red-600 text-white text-xs font-bold">
              {config.name.charAt(0)}
            </div>
          )}
          <span className="font-semibold text-gray-900">{config.widgetTitle}</span>
        </div>
        <p className="mb-4 text-sm text-gray-600">
          {config.privacyPolicyText || "Zur Nutzung dieser Online-Rezeption müssen Sie unsere Datenschutzbestimmungen akzeptieren."}
        </p>
        {config.privacyPolicyUrl && (
          <a
            href={config.privacyPolicyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
          >
            Datenschutzerklärung lesen <ExternalLink className="size-3" />
          </a>
        )}
        <button className={S.btn} onClick={onAccept}>
          Verstanden & Fortfahren
        </button>
        <p className="mt-3 text-center text-[10px] text-gray-400">
          Ein Produkt von{" "}
          <a href="https://medflex-schweiz.ch" target="_blank" rel="noopener noreferrer" className="underline">
            MedFlex
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── Location Selector ────────────────────────────────────────────────────────

function LocationSelector({
  locations,
  onSelect,
}: {
  locations: Location[];
  onSelect: (loc: Location) => void;
}) {
  return (
    <div className={S.overlay} style={{ pointerEvents: "auto" }}>
      <div className={S.overlayCard}>
        <p className="mb-3 font-semibold text-gray-900">Bitte wählen Sie Ihren Standort</p>
        <div className="space-y-2">
          {locations.map((loc) => (
            <button
              key={loc.id}
              className="flex w-full items-start gap-3 rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50 transition-colors"
              onClick={() => onSelect(loc)}
            >
              <MapPin className="mt-0.5 size-4 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">{loc.name}</p>
                {loc.address && <p className="text-xs text-gray-500">{loc.address}</p>}
                {loc.phone && <p className="text-xs text-gray-500">{loc.phone}</p>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Opening Hours ────────────────────────────────────────────────────────────

function OpeningHoursTable({ hours }: { hours: OpeningHour[] }) {
  const today = (new Date().getDay() + 6) % 7; // 0=Mo
  return (
    <div className="space-y-1">
      {hours.map((h) => (
        <div key={h.dayOfWeek} className={`flex text-xs ${h.dayOfWeek === today ? "font-semibold text-gray-900" : "text-gray-600"}`}>
          <span className="w-24 shrink-0">{DAYS[h.dayOfWeek]}</span>
          {h.isClosed ? (
            <span className="text-gray-400">Geschlossen</span>
          ) : (
            <span>{h.openTime} – {h.closeTime}{h.note ? ` (${h.note})` : ""}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Form Step Renderer ───────────────────────────────────────────────────────

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.type === "radio") {
    return (
      <div className="space-y-2">
        {(field.options ?? []).map((opt) => (
          <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="radio"
              name={field.id}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="accent-red-600"
            />
            <span className="text-sm text-gray-700">{opt}</span>
          </label>
        ))}
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={S.input}>
        <option value="">Bitte wählen …</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }
  if (field.type === "textarea") {
    return (
      <textarea
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={S.input}
        rows={3}
      />
    );
  }
  return (
    <input
      type={field.type === "date" ? "date" : field.type === "time" ? "time" : field.type === "number" ? "number" : "text"}
      value={value}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={S.input}
    />
  );
}

// ─── Contact Step ─────────────────────────────────────────────────────────────

interface ContactData {
  forSelf: ForSelf;
  proxyName: string;
  proxyBirthdate: string;
  firstName: string;
  lastName: string;
  birthdate: string;
  phone: string;
  email: string;
  countryCode: string;
}

function ContactStep({
  defaultCountryCode,
  data,
  onChange,
}: {
  defaultCountryCode: string;
  data: ContactData;
  onChange: (d: ContactData) => void;
}) {
  function set(key: keyof ContactData, value: string) {
    onChange({ ...data, [key]: value });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={S.label}>Für wen stellen Sie diese Anfrage?</label>
        <div className="flex gap-2">
          {(["self", "proxy"] as ForSelf[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => set("forSelf", v)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                data.forSelf === v
                  ? "border-red-600 bg-red-50 text-red-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {v === "self" ? <User className="size-3.5" /> : <Users className="size-3.5" />}
              {v === "self" ? "Für mich selbst" : "Als Vertretung"}
            </button>
          ))}
        </div>
      </div>

      {data.forSelf === "proxy" && (
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
          <p className="text-xs font-medium text-gray-700">Angaben zur vertretenen Person</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={S.label}>Vorname</label>
              <input value={data.proxyName.split(" ")[0] ?? ""} onChange={(e) => set("proxyName", `${e.target.value} ${data.proxyName.split(" ").slice(1).join(" ")}`.trim())} className={S.input} placeholder="Vorname" />
            </div>
            <div>
              <label className={S.label}>Nachname</label>
              <input value={data.proxyName.split(" ").slice(1).join(" ")} onChange={(e) => set("proxyName", `${data.proxyName.split(" ")[0] ?? ""} ${e.target.value}`.trim())} className={S.input} placeholder="Nachname" />
            </div>
          </div>
          <div>
            <label className={S.label}>Geburtsdatum</label>
            <input type="date" value={data.proxyBirthdate} onChange={(e) => set("proxyBirthdate", e.target.value)} className={S.input} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={S.label}>Vorname</label>
          <input value={data.firstName} onChange={(e) => set("firstName", e.target.value)} className={S.input} placeholder="Vorname" />
        </div>
        <div>
          <label className={S.label}>Nachname</label>
          <input value={data.lastName} onChange={(e) => set("lastName", e.target.value)} className={S.input} placeholder="Nachname" />
        </div>
      </div>

      <div>
        <label className={S.label}>Geburtsdatum</label>
        <input type="date" value={data.birthdate} onChange={(e) => set("birthdate", e.target.value)} className={S.input} />
      </div>

      <div>
        <label className={S.label}>Mobilnummer</label>
        <div className="flex gap-1.5">
          <select
            value={data.countryCode}
            onChange={(e) => set("countryCode", e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-2 text-sm outline-none focus:border-red-400 w-20"
          >
            {["+41", "+49", "+43", "+33", "+39", "+44"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => set("phone", e.target.value)}
            className={`${S.input} flex-1`}
            placeholder="079 000 00 00"
          />
        </div>
      </div>

      <div>
        <label className={S.label}>E-Mail</label>
        <input type="email" value={data.email} onChange={(e) => set("email", e.target.value)} className={S.input} placeholder="name@beispiel.ch" />
      </div>
    </div>
  );
}

// ─── Form Flow ────────────────────────────────────────────────────────────────

type FormState = "idle" | "steps" | "contact" | "uploading" | "success";

function FormTab({
  config,
  location,
}: {
  config: WidgetConfig;
  location: Location | null;
}) {
  const [formState, setFormState] = useState<FormState>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [contact, setContact] = useState<ContactData>({
    forSelf: "self",
    proxyName: "",
    proxyBirthdate: "",
    firstName: "",
    lastName: "",
    birthdate: "",
    phone: "",
    email: "",
    countryCode: config.defaultCountryCode,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const steps = config.formSteps;
  const currentStep = steps[stepIndex];

  function setAnswer(fieldId: string, value: string) {
    setAnswers((a) => ({ ...a, [fieldId]: value }));
  }

  function canProceed(): boolean {
    if (!currentStep) return true;
    return currentStep.fields.filter((f) => f.required).every((f) => !!answers[f.id]);
  }

  function canSubmit(): boolean {
    return !!(contact.firstName && contact.lastName && contact.email && contact.phone);
  }

  async function submit() {
    setFormState("uploading");
    try {
      const fd = new FormData();
      fd.append("clientId", config.id);
      fd.append("answers", JSON.stringify(answers));
      fd.append("contact", JSON.stringify(contact));
      fd.append("location", JSON.stringify(location));
      files.forEach((f) => fd.append("files", f));
      await fetch(`/api/widget/${config.slug}/submit`, { method: "POST", body: fd });
    } catch {
      // best-effort
    }
    setFormState("success");
  }

  if (formState === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <CheckCircle2 className="mb-3 size-12 text-green-500" />
        <p className="font-semibold text-gray-900">Anfrage eingegangen!</p>
        <p className="mt-1 text-sm text-gray-500">
          Wir melden uns in Kürze bei Ihnen. Eine Bestätigung wurde an Ihre E-Mail gesendet.
        </p>
        <button className={`${S.btnSm} mt-4`} onClick={() => { setFormState("idle"); setAnswers({}); setFiles([]); setStepIndex(0); }}>
          Neue Anfrage
        </button>
      </div>
    );
  }

  if (formState === "uploading") {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="mb-3 size-8 animate-spin text-red-600" />
        <p className="text-sm text-gray-600">Anfrage wird gesendet …</p>
      </div>
    );
  }

  if (formState === "idle") {
    if (steps.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm text-gray-500">Kein Formular konfiguriert.</p>
        </div>
      );
    }
    return (
      <div className="space-y-3 py-2">
        <p className="text-sm text-gray-700">Was können wir für Sie tun?</p>
        <button className={S.btn} onClick={() => setFormState("steps")}>
          Formular starten
        </button>
      </div>
    );
  }

  if (formState === "contact") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Schritt {steps.length + 1} / {steps.length + 1}</span>
          <span>— Kontaktdaten</span>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
          <ContactStep defaultCountryCode={config.defaultCountryCode} data={contact} onChange={setContact} />
        </div>
        {/* File upload */}
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800"
          >
            <Paperclip className="size-3.5" />
            Dateien/Fotos hinzufügen {files.length > 0 && `(${files.length})`}
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const selected = Array.from(e.target.files ?? []);
              setFiles((f) => [...f, ...selected]);
            }}
          />
          {files.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-gray-600">
                  <span className="truncate">{f.name}</span>
                  <button onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="ml-2 text-gray-400 hover:text-red-500">
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button className={S.btnSmOutline} onClick={() => setFormState("steps")}>
            <ChevronLeft className="inline size-3.5" /> Zurück
          </button>
          <button className={`${S.btnSm} flex-1`} onClick={submit} disabled={!canSubmit()}>
            Absenden
          </button>
        </div>
      </div>
    );
  }

  // formState === "steps"
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>Schritt {stepIndex + 1} / {steps.length + 1}</span>
        {currentStep?.subtitle && <span>— {currentStep.subtitle}</span>}
      </div>

      {currentStep && (
        <>
          <p className="text-sm font-semibold text-gray-900">{currentStep.title}</p>
          <div className="overflow-y-auto space-y-4" style={{ maxHeight: 260 }}>
            {currentStep.fields.map((f) => (
              <div key={f.id}>
                <label className={`${S.label} ${f.required ? "after:ml-0.5 after:text-red-500 after:content-['*']" : ""}`}>
                  {f.label}
                </label>
                <FieldRenderer field={f} value={answers[f.id] ?? ""} onChange={(v) => setAnswer(f.id, v)} />
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex gap-2">
        {stepIndex > 0 && (
          <button className={S.btnSmOutline} onClick={() => setStepIndex((i) => i - 1)}>
            <ChevronLeft className="inline size-3.5" /> Zurück
          </button>
        )}
        <button
          className={`${S.btnSm} flex-1`}
          disabled={!canProceed()}
          onClick={() => {
            if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
            else setFormState("contact");
          }}
        >
          {stepIndex < steps.length - 1 ? (
            <span>Weiter <ChevronRight className="inline size-3.5" /></span>
          ) : (
            "Zu den Kontaktdaten"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────

type ChatState = "idle" | "contact" | "connecting" | "active" | "ended";

function ChatTab({ config, location, onOpenForm }: {
  config: WidgetConfig;
  location: Location | null;
  onOpenForm: () => void;
}) {
  const [chatState, setChatState] = useState<ChatState>("idle");
  const [contact, setContact] = useState<ContactData>({
    forSelf: "self", proxyName: "", proxyBirthdate: "",
    firstName: "", lastName: "", birthdate: "",
    phone: "", email: "", countryCode: config.defaultCountryCode,
  });
  const [isMuted, setIsMuted] = useState(false);
  const conversationRef = useRef<unknown>(null);

  function canStart() {
    return !!(contact.firstName && contact.lastName && contact.email && contact.phone);
  }

  async function startChat() {
    if (!config.elevenLabsAgentId) return;
    setChatState("connecting");
    try {
      const { Conversation } = await import("@11labs/client");
      const res = await fetch(`/api/elevenlabs/session`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId: config.elevenLabsAgentId }),
      });
      const { token } = await res.json();

      const conv = await Conversation.startSession({
        signedUrl: token,
        onMessage: (msg: { message: string }) => {
          if (msg.message.includes("[OPEN_FORM:")) {
            onOpenForm();
          }
        },
        onDisconnect: () => setChatState("ended"),
      });
      conversationRef.current = conv;
      setChatState("active");
    } catch {
      setChatState("idle");
    }
  }

  async function endChat() {
    if (conversationRef.current) {
      try {
        const conv = conversationRef.current as { endSession: () => Promise<void> };
        await conv.endSession();
      } catch {}
    }
    // Send summary email
    fetch(`/api/widget/${config.slug}/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "chat", contact, location }),
    }).catch(() => {});
    setChatState("ended");
  }

  if (chatState === "ended") {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <CheckCircle2 className="mb-3 size-12 text-green-500" />
        <p className="font-semibold text-gray-900">Gespräch beendet</p>
        <p className="mt-1 text-sm text-gray-500">Vielen Dank. Wir werden Sie bei Bedarf kontaktieren.</p>
        <button className={`${S.btnSm} mt-4`} onClick={() => setChatState("idle")}>
          Neues Gespräch
        </button>
      </div>
    );
  }

  if (chatState === "active") {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
        <div className="relative flex size-20 items-center justify-center rounded-full bg-red-50">
          <div className="absolute inset-0 animate-ping rounded-full bg-red-100" />
          <Mic className="relative size-8 text-red-600" />
        </div>
        <p className="font-semibold text-gray-900">Gespräch läuft …</p>
        <p className="text-xs text-gray-500">Sprechen Sie mit unserem Assistenten.</p>
        <div className="flex gap-2">
          <button
            className={S.btnSmOutline}
            onClick={() => setIsMuted((m) => !m)}
          >
            {isMuted ? <MicOff className="inline size-4" /> : <Mic className="inline size-4" />}
            {isMuted ? " Stummschaltung aufheben" : " Stummschalten"}
          </button>
          <button className={S.btnSm} onClick={endChat}>
            Beenden
          </button>
        </div>
      </div>
    );
  }

  if (chatState === "connecting") {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="mb-3 size-8 animate-spin text-red-600" />
        <p className="text-sm text-gray-600">Verbindung wird aufgebaut …</p>
      </div>
    );
  }

  if (chatState === "contact") {
    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold text-gray-900">Ihre Kontaktdaten</p>
        <p className="text-xs text-gray-500">Bevor wir das Gespräch starten, benötigen wir kurz Ihre Angaben.</p>
        <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
          <ContactStep defaultCountryCode={config.defaultCountryCode} data={contact} onChange={setContact} />
        </div>
        <div className="flex gap-2">
          <button className={S.btnSmOutline} onClick={() => setChatState("idle")}>Zurück</button>
          <button className={`${S.btnSm} flex-1`} disabled={!canStart()} onClick={startChat}>
            Chat starten
          </button>
        </div>
      </div>
    );
  }

  // idle
  if (!config.elevenLabsAgentId) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <MessageCircle className="mb-3 size-10 text-gray-300" />
        <p className="text-sm text-gray-500">Chat ist noch nicht konfiguriert.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
      <div className="flex size-16 items-center justify-center rounded-full bg-red-50">
        <MessageCircle className="size-8 text-red-600" />
      </div>
      <p className="font-semibold text-gray-900">Chat mit unserem Assistenten</p>
      <p className="text-sm text-gray-500">Stellen Sie Ihre Fragen direkt per Sprache oder Text.</p>
      <button className={S.btn} onClick={() => setChatState("contact")}>
        Chat starten
      </button>
    </div>
  );
}

// ─── Startseite Tab ───────────────────────────────────────────────────────────

function StartseiteTab({
  config,
  location,
  onOpenForm,
  onOpenChat,
}: {
  config: WidgetConfig;
  location: Location | null;
  onOpenForm: () => void;
  onOpenChat: () => void;
}) {
  return (
    <div className="space-y-4 overflow-y-auto" style={{ maxHeight: 420 }}>
      {/* Intro */}
      {(config.fachrichtung || config.introText) && (
        <div>
          {config.fachrichtung && (
            <p className="mb-1 text-xs font-medium text-red-600">{config.fachrichtung}</p>
          )}
          {config.introText && (
            <p className="text-sm text-gray-700">{config.introText}</p>
          )}
        </div>
      )}

      {/* Quick-CTAs */}
      <div className="grid grid-cols-2 gap-2">
        <button
          className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          onClick={onOpenForm}
        >
          <Calendar className="size-5 text-red-600" />
          Termin anfragen
        </button>
        <button
          className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          onClick={onOpenChat}
        >
          <MessageCircle className="size-5 text-red-600" />
          Mit uns chatten
        </button>
      </div>

      {/* Öffnungszeiten */}
      {location && location.openingHours.some((h) => !h.isClosed) && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <Clock className="size-3.5" />
            Öffnungszeiten
            {location.name !== "Hauptstandort" && (
              <span className="text-gray-400">— {location.name}</span>
            )}
          </div>
          <OpeningHoursTable hours={location.openingHours} />
        </div>
      )}

      {/* Kontakt */}
      {location && (location.phone || location.address) && (
        <div className="space-y-1.5">
          {location.phone && (
            <a href={`tel:${location.phone}`} className="flex items-center gap-2 text-xs text-gray-600 hover:text-red-600">
              <Phone className="size-3.5" />
              {location.phone}
            </a>
          )}
          {location.address && (
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              {location.address}
            </div>
          )}
        </div>
      )}

      {/* News */}
      {config.news.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <Newspaper className="size-3.5" />
            Aktuelles
          </div>
          <div className="space-y-2">
            {config.news.map((n) => (
              <div key={n.id} className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
                <p className="text-xs font-semibold text-gray-900">{n.title}</p>
                {n.body && <p className="mt-0.5 text-xs text-gray-600">{n.body}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Panel (open) ─────────────────────────────────────────────────────────────

function WidgetPanel({
  config,
  location,
  onClose,
}: {
  config: WidgetConfig;
  location: Location | null;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<PanelTab>("startseite");
  const tabs: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
    { id: "startseite", label: "Start", icon: <Clock className="size-3.5" /> },
    { id: "formular",   label: "Formular", icon: <Calendar className="size-3.5" /> },
    { id: "chat",       label: "Chat", icon: <MessageCircle className="size-3.5" /> },
  ];

  return (
    <div className={S.panel}>
      {/* Header */}
      <div className={S.panelHeader}>
        {config.logoPath ? (
          <img src={config.logoPath} alt={config.name} className="size-7 rounded-md object-contain" />
        ) : (
          <div className="flex size-7 items-center justify-center rounded-md bg-red-600 text-white text-xs font-bold shrink-0">
            {config.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{config.widgetTitle}</p>
          {config.widgetSubtitle && (
            <p className="truncate text-xs text-gray-500">{config.widgetSubtitle}</p>
          )}
        </div>
        <button onClick={onClose} className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
          <X className="size-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className={S.tabBar}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`${S.tab} ${activeTab === t.id ? S.tabActive : S.tabInactive} flex items-center justify-center gap-1`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4">
        {activeTab === "startseite" && (
          <StartseiteTab
            config={config}
            location={location}
            onOpenForm={() => setActiveTab("formular")}
            onOpenChat={() => setActiveTab("chat")}
          />
        )}
        {activeTab === "formular" && (
          <FormTab config={config} location={location} />
        )}
        {activeTab === "chat" && (
          <ChatTab
            config={config}
            location={location}
            onOpenForm={() => setActiveTab("formular")}
          />
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-2 text-center">
        <p className="text-[10px] text-gray-400">
          Ein Produkt von{" "}
          <a href="https://medflex-schweiz.ch" target="_blank" rel="noopener noreferrer" className="underline">
            MedFlex
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export function WidgetApp({ config }: { config: WidgetConfig }) {
  const [view, setView] = useState<WidgetView>("teaser");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    config.locations.find((l) => l.isDefault) ?? config.locations[0] ?? null
  );

  const needsLocationSelect = config.locations.length > 1 && !locationSelected;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`reception_privacy_${config.slug}`);
      if (stored === "1") setPrivacyAccepted(true);
    } catch {}
  }, [config.slug]);

  function acceptPrivacy() {
    try { localStorage.setItem(`reception_privacy_${config.slug}`, "1"); } catch {}
    setPrivacyAccepted(true);
  }

  function selectLocation(loc: Location) {
    setSelectedLocation(loc);
    setLocationSelected(true);
  }

  function handleQA(target: string) {
    setView("panel");
  }

  const qas = [
    { label: config.qa1Label, target: config.qa1Target, icon: <Calendar className="size-3.5" /> },
    { label: config.qa2Label, target: config.qa2Target, icon: <MessageCircle className="size-3.5" /> },
    { label: config.qa3Label, target: config.qa3Target, icon: <MoreHorizontal className="size-3.5" /> },
  ];

  // ── Overlays first ──

  if (!privacyAccepted) {
    return <PrivacyOverlay config={config} onAccept={acceptPrivacy} />;
  }

  if (needsLocationSelect) {
    return <LocationSelector locations={config.locations} onSelect={selectLocation} />;
  }

  // ── Widget ──

  return (
    <div className="fixed bottom-5 right-5 flex flex-col items-end gap-2" style={{ pointerEvents: "auto" }}>
      {view === "collapsed" ? (
        <button
          className={S.circle}
          onClick={() => setView("teaser")}
          aria-label="Rezeption öffnen"
        >
          {config.logoPath ? (
            <img src={config.logoPath} alt={config.name} className="size-8 rounded-full object-contain" />
          ) : (
            <span className="text-lg font-bold text-red-600">{config.name.charAt(0)}</span>
          )}
        </button>
      ) : view === "panel" ? (
        <WidgetPanel
          config={config}
          location={selectedLocation}
          onClose={() => setView("collapsed")}
        />
      ) : (
        /* teaser */
        <>
          {/* Quick-action buttons */}
          <div className={S.strip}>
            {qas.map((qa, i) => (
              <button key={i} className={S.qaBtn} onClick={() => handleQA(qa.target)}>
                {qa.icon}
                {qa.label}
              </button>
            ))}
          </div>

          {/* Main rectangle */}
          <div className="relative w-80">
            <button
              className={`${S.rect} w-full`}
              onClick={() => setView("panel")}
            >
              <div className="flex items-center gap-3 min-w-0">
                {config.logoPath ? (
                  <img src={config.logoPath} alt={config.name} className="size-9 shrink-0 rounded-xl object-contain" />
                ) : (
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white text-sm font-bold">
                    {config.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 text-left">
                  <p className="truncate text-sm font-semibold text-gray-900">{config.widgetTitle}</p>
                  {config.widgetSubtitle && (
                    <p className="truncate text-xs text-gray-500">{config.widgetSubtitle}</p>
                  )}
                </div>
              </div>
              <ChevronRight className="ml-2 size-4 shrink-0 text-gray-400" />
            </button>
            <button
              onClick={() => setView("collapsed")}
              className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 hover:text-gray-700 shadow-sm"
              aria-label="Minimieren"
            >
              <X className="size-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
