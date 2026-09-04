"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar, MessageCircle, MoreHorizontal, X, ChevronRight,
  ChevronLeft, Paperclip, User, Users, CheckCircle2,
  Clock, Newspaper, Send, Loader2, MapPin,
  ExternalLink, FileText, Plus, House, Search,
  AlertCircle, Pill, Syringe, ScrollText, Cross, Activity, Bandage,
} from "lucide-react";
import type { ComponentType } from "react";

const FORM_ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  calendar:    Calendar,
  pill:        Pill,
  syringe:     Syringe,
  "scroll-text": ScrollText,
  more:        MoreHorizontal,
  cross:       Cross,
  activity:    Activity,
  bandage:     Bandage,
  file:        FileText,
};
function FormIcon({ id, className }: { id: string; className?: string }) {
  const Icon = FORM_ICON_MAP[id] ?? FileText;
  return <Icon className={className} />;
}
import type { FormType, FormStep, FormField } from "@/lib/reception-form-templates";

// ─── Config types ─────────────────────────────────────────────────────────────

interface OpeningHour {
  dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean; note: string;
}
interface Location {
  id: string; name: string; address: string; phone: string;
  openingHoursText: string; isDefault: boolean;
  openingHours: OpeningHour[];
}
export interface WidgetConfig {
  id: string; slug: string; name: string; logoPath: string;
  widgetTitle: string; widgetSubtitle: string; accentColor: string;
  defaultCountryCode: string; elevenLabsAgentId: string;
  privacyPolicyText: string; privacyPolicyUrl: string;
  qa1Label: string; qa1Target: string;
  qa2Label: string; qa2Target: string;
  qa3Label: string; qa3Target: string;
  fachrichtung: string; introText: string;
  formSteps: FormType[];
  locations: Location[];
  news: { id: string; title: string; body: string }[];
}

type PanelTab = "home" | "formular" | "chat";
type ForSelf = "self" | "proxy";

// ─── Contact data (shared between form and chat) ───────────────────────────

interface ContactData {
  forSelf: ForSelf; proxyName: string; proxyBirthdate: string;
  firstName: string; lastName: string; birthdate: string;
  phone: string; email: string; countryCode: string;
  privacyConsent: boolean;
}

const EMPTY_CONTACT = (cc: string): ContactData => ({
  forSelf: "self", proxyName: "", proxyBirthdate: "",
  firstName: "", lastName: "", birthdate: "",
  phone: "", email: "", countryCode: cc, privacyConsent: false,
});

// ─── Country data ─────────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: "+41", flag: "🇨🇭", name: "CH" },
  { code: "+49", flag: "🇩🇪", name: "DE" },
  { code: "+43", flag: "🇦🇹", name: "AT" },
  { code: "+33", flag: "🇫🇷", name: "FR" },
  { code: "+39", flag: "🇮🇹", name: "IT" },
  { code: "+44", flag: "🇬🇧", name: "GB" },
  { code: "+1",  flag: "🇺🇸", name: "US" },
];

// ─── CSS helpers ──────────────────────────────────────────────────────────────

function btn(accent: string) {
  return { style: { background: accent, color: "#fff" } };
}

const BASE = {
  input: "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition",
  label: "block text-xs font-medium text-gray-700 mb-1",
  btnSm: "rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed",
  btnSmOut: "rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors",
};

// ─── Logo/Avatar ──────────────────────────────────────────────────────────────

function LogoMark({ config, size = 8, round = false }: { config: WidgetConfig; size?: number; round?: boolean }) {
  const shape = round ? "rounded-full" : "rounded-lg";
  if (config.logoPath) {
    return <img src={config.logoPath} alt={config.name} className={`size-${size} ${shape} object-contain`} />;
  }
  return (
    <div
      className={`flex size-${size} shrink-0 items-center justify-center ${shape} text-white font-bold`}
      style={{ background: config.accentColor, fontSize: size > 8 ? 18 : 13 }}
    >
      {config.name.charAt(0)}
    </div>
  );
}

// ─── Privacy Overlay ──────────────────────────────────────────────────────────

function PrivacyOverlay({ config, onAccept, onDecline }: {
  config: WidgetConfig; onAccept: () => void; onDecline: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col rounded-2xl bg-white p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <LogoMark config={config} size={8} />
        <span className="font-semibold text-gray-900 text-sm">{config.widgetTitle}</span>
      </div>
      <p className="mb-4 text-sm text-gray-700 leading-relaxed flex-1">
        {config.privacyPolicyText || "Zur Nutzung dieser Online-Rezeption bitten wir Sie, unsere Datenschutzbestimmungen zu akzeptieren."}
      </p>
      {config.privacyPolicyUrl && (
        <a href={config.privacyPolicyUrl} target="_blank" rel="noopener noreferrer"
          className="mb-4 inline-flex items-center gap-1 text-xs underline" style={{ color: config.accentColor }}>
          Datenschutzerklärung lesen <ExternalLink className="size-3" />
        </a>
      )}
      <button className={`${BASE.btnSm} w-full py-2.5 text-sm`} {...btn(config.accentColor)} onClick={onAccept}>
        Akzeptieren & Fortfahren
      </button>
      <button onClick={onDecline} className="mt-2 text-center text-xs text-gray-400 hover:text-gray-600">
        Ablehnen
      </button>
    </div>
  );
}

function PrivacyDeclinedScreen({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl bg-white p-6 text-center">
      <AlertCircle className="mb-3 size-10 text-gray-400" />
      <p className="mb-1 font-semibold text-gray-900">Online-Rezeption nicht verfügbar</p>
      <p className="mb-5 text-sm text-gray-500">
        Ohne Akzeptieren der Datenschutzbestimmungen kann die Online-Rezeption nicht genutzt werden.
      </p>
      <button className={`${BASE.btnSm} px-6 py-2`} onClick={onAccept}
        style={{ background: "#374151", color: "#fff" }}>
        Datenschutz akzeptieren
      </button>
    </div>
  );
}

// ─── Location Selector ────────────────────────────────────────────────────────

function LocationSelector({ locations, onSelect }: {
  locations: Location[]; onSelect: (loc: Location) => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col rounded-2xl bg-white p-5">
      <p className="mb-3 font-semibold text-gray-900 text-sm">Bitte wählen Sie Ihren Standort</p>
      <div className="space-y-2 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        {locations.map((loc) => (
          <button key={loc.id} onClick={() => onSelect(loc)}
            className="flex w-full items-start gap-3 rounded-xl border border-gray-100 p-3 text-left hover:bg-gray-50 transition-colors">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">{loc.name}</p>
              {loc.address && <p className="text-xs text-gray-500">{loc.address}</p>}
              {loc.phone && <p className="text-xs text-gray-500">{loc.phone}</p>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Contact Step ─────────────────────────────────────────────────────────────

const INPUT_ERR = "w-full rounded-lg border border-red-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition";

function birthdateError(value: string, requireAdult: boolean): string | undefined {
  if (!value) return "Pflichtfeld";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(value);
  if (isNaN(d.getTime()) || d > today) return "Das Datum ist ungültig.";
  if (requireAdult) {
    const min18 = new Date(today); min18.setFullYear(min18.getFullYear() - 18);
    if (d > min18) return "Sie müssen mind. 18 Jahre alt sein.";
  }
  return undefined;
}

const TODAY_STR = new Date().toISOString().split("T")[0];

function ContactStep({ config, data, onChange }: {
  config: WidgetConfig; data: ContactData; onChange: (d: ContactData) => void;
}) {
  const [touched, setTouched] = useState<Partial<Record<keyof ContactData, boolean>>>({});

  function set(key: keyof ContactData, value: string | boolean) {
    onChange({ ...data, [key]: value });
  }
  function touch(key: keyof ContactData) {
    setTouched((t) => ({ ...t, [key]: true }));
  }

  function field(key: keyof ContactData, label: string, el: React.ReactNode, err?: string) {
    const hasErr = touched[key] && err;
    return (
      <div>
        <label className={`block text-xs font-medium mb-1 ${hasErr ? "text-red-600" : "text-gray-700"}`}>{label}</label>
        {el}
        {hasErr && <p className="mt-0.5 text-xs text-red-500">{err}</p>}
      </div>
    );
  }

  const emailOk = !data.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  const bdErr = birthdateError(data.birthdate, true); // representative always 18+
  const bdCls = touched.birthdate && bdErr ? INPUT_ERR : BASE.input;

  // proxy patient date: only future-date check, no age restriction
  const proxyBdErr = data.proxyBirthdate
    ? (new Date(data.proxyBirthdate) > new Date() ? "Das Datum ist ungültig." : undefined)
    : undefined;

  return (
    <div className="space-y-3">
      <div>
        <label className={BASE.label}>Für wen stellen Sie diese Anfrage?</label>
        <div className="flex gap-2">
          {(["self", "proxy"] as ForSelf[]).map((v) => (
            <button key={v} type="button" onClick={() => set("forSelf", v)}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
              style={data.forSelf === v ? { borderColor: config.accentColor, background: config.accentColor + "18", color: config.accentColor } : { borderColor: "#e5e7eb", color: "#374151" }}>
              {v === "self" ? <User className="size-3.5" /> : <Users className="size-3.5" />}
              {v === "self" ? "Für mich" : "Als Vertretung"}
            </button>
          ))}
        </div>
      </div>

      {data.forSelf === "proxy" && (
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
          <p className="text-xs font-medium text-gray-700">Vertretene Person</p>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={BASE.label}>Vorname</label><input className={BASE.input} placeholder="Vorname" value={data.proxyName.split(" ")[0] ?? ""} onChange={(e) => set("proxyName", `${e.target.value} ${data.proxyName.split(" ").slice(1).join(" ")}`.trim())} /></div>
            <div><label className={BASE.label}>Nachname</label><input className={BASE.input} placeholder="Nachname" value={data.proxyName.split(" ").slice(1).join(" ")} onChange={(e) => set("proxyName", `${data.proxyName.split(" ")[0] ?? ""} ${e.target.value}`.trim())} /></div>
          </div>
          <div>
            <label className={`${BASE.label} ${proxyBdErr ? "text-red-600" : ""}`}>Geburtsdatum</label>
            <input type="date" max={TODAY_STR} min="1900-01-01"
              className={`${BASE.input} cursor-pointer [color-scheme:light] ${proxyBdErr ? "border-red-400" : ""}`}
              value={data.proxyBirthdate}
              onChange={(e) => { const v = e.target.value; if (v && (v.split("-")[0]?.length ?? 0) > 4) return; set("proxyBirthdate", v); }} />
            {proxyBdErr && <p className="mt-0.5 text-xs text-red-500">{proxyBdErr}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {field("firstName", "Vorname *",
          <input className={touched.firstName && !data.firstName ? INPUT_ERR : BASE.input}
            placeholder="Vorname" value={data.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            onBlur={() => touch("firstName")} />,
          !data.firstName ? "Pflichtfeld" : undefined
        )}
        {field("lastName", "Nachname *",
          <input className={touched.lastName && !data.lastName ? INPUT_ERR : BASE.input}
            placeholder="Nachname" value={data.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            onBlur={() => touch("lastName")} />,
          !data.lastName ? "Pflichtfeld" : undefined
        )}
      </div>

      {field("birthdate",
        data.forSelf === "proxy" ? "Ihr Geburtsdatum (Vertretung) *" : "Geburtsdatum *",
        <input type="date"
          max={TODAY_STR} min="1900-01-01"
          className={`${bdCls} cursor-pointer [color-scheme:light]`}
          value={data.birthdate}
          onChange={(e) => { const v = e.target.value; if (v && (v.split("-")[0]?.length ?? 0) > 4) return; set("birthdate", v); }}
          onBlur={() => touch("birthdate")} />,
        bdErr
      )}

      {field("phone", "Mobilnummer *",
        <div className="flex gap-1.5">
          <select value={data.countryCode} onChange={(e) => set("countryCode", e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-900 outline-none"
            style={{ minWidth: 72 }}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
            ))}
          </select>
          <input type="tel"
            className={`${touched.phone && !data.phone ? INPUT_ERR : BASE.input} flex-1`}
            placeholder="79 000 00 00" value={data.phone}
            onChange={(e) => set("phone", e.target.value)}
            onBlur={() => touch("phone")} />
        </div>,
        !data.phone ? "Pflichtfeld" : undefined
      )}

      {field("email", "E-Mail *",
        <input type="email"
          className={touched.email && (!data.email || !emailOk) ? INPUT_ERR : BASE.input}
          placeholder="name@beispiel.ch" value={data.email}
          onChange={(e) => set("email", e.target.value)}
          onBlur={() => touch("email")} />,
        !data.email ? "Pflichtfeld" : !emailOk ? "Ungültige E-Mail-Adresse" : undefined
      )}

      {/* Privacy checkbox */}
      <div>
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" checked={data.privacyConsent}
            onChange={(e) => { set("privacyConsent", e.target.checked); touch("privacyConsent"); }}
            className="mt-0.5" style={{ accentColor: config.accentColor }} />
          <span className="text-xs text-gray-600">
            Ich stimme der Verarbeitung meiner Daten gemäss{" "}
            <a href="https://medflex-schweiz.ch/datenschutz" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: config.accentColor }}>Datenschutzerklärung</a>
            {" "}zu.
          </span>
        </label>
        {touched.privacyConsent && !data.privacyConsent && (
          <p className="mt-0.5 text-xs text-red-500 ml-5">Bitte akzeptieren Sie die Datenschutzerklärung</p>
        )}
      </div>
    </div>
  );
}

// ─── Medication List Field ─────────────────────────────────────────────────────

type MedEntry = { name: string; qty: number; pkg?: string };
type MedSearchResult = { id: number; name: string };

function parseMeds(value: string): MedEntry[] {
  if (!value) return [];
  try { return JSON.parse(value) as MedEntry[]; } catch { return []; }
}
function serializeMeds(items: MedEntry[]): string {
  return items.length ? JSON.stringify(items) : "";
}

function MedicationListField({ value, onChange, accent }: {
  value: string; onChange: (v: string) => void; accent: string;
}) {
  const items = parseMeds(value);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MedSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/medication-search?q=${encodeURIComponent(query)}`);
        const data = await res.json() as MedSearchResult[];
        setResults(data);
        setOpen(data.length > 0);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function addMed(name: string) {
    if (items.some((m) => m.name === name)) return;
    onChange(serializeMeds([...items, { name, qty: 1 }]));
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function setQty(i: number, qty: number) {
    if (qty < 1) return;
    onChange(serializeMeds(items.map((m, idx) => idx === i ? { ...m, qty } : m)));
  }

  function setPkg(i: number, pkg: string) {
    onChange(serializeMeds(items.map((m, idx) => idx === i ? { ...m, pkg } : m)));
  }

  function removeItem(i: number) {
    onChange(serializeMeds(items.filter((_, idx) => idx !== i)));
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div ref={wrapRef} className="relative">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
          <input
            className={`${BASE.input} pl-8 pr-8`}
            placeholder="Medikament suchen …"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
          />
          {loading && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          )}
        </div>

        {/* Dropdown */}
        {open && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
            <div className="max-h-48 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              {results.map((r) => {
                const already = items.some((m) => m.name === r.name);
                return (
                  <button key={r.id} type="button"
                    onClick={() => !already && addMed(r.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                      already ? "cursor-default" : "hover:bg-gray-50"
                    }`}>
                    <span className={`text-sm truncate ${already ? "text-gray-400" : "text-gray-800"}`}>{r.name}</span>
                    {already
                      ? <span className="shrink-0 ml-2 text-xs text-gray-400">hinzugefügt</span>
                      : <Plus className="shrink-0 ml-2 size-3.5" style={{ color: accent }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Added medications list */}
      {items.length > 0 && (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 space-y-1.5">
              {/* Row 1: name + stepper + remove */}
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm text-gray-800 truncate min-w-0">{item.name}</span>
                <div className="shrink-0 flex items-center gap-1">
                  <button type="button" onClick={() => setQty(i, item.qty - 1)}
                    className="flex size-5 items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 text-xs font-bold leading-none">
                    −
                  </button>
                  <span className="w-5 text-center text-xs font-medium text-gray-800">{item.qty}</span>
                  <button type="button" onClick={() => setQty(i, item.qty + 1)}
                    className="flex size-5 items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 text-xs font-bold leading-none">
                    +
                  </button>
                </div>
                <button type="button" onClick={() => removeItem(i)} className="shrink-0 text-gray-400 hover:text-red-500">
                  <X className="size-3.5" />
                </button>
              </div>
              {/* Row 2: package size */}
              <input
                type="text"
                value={item.pkg ?? ""}
                onChange={(e) => setPkg(i, e.target.value)}
                placeholder="Packungsgrösse (z. B. 28 Stk, 1 g)"
                className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 placeholder-gray-400 outline-none"
              />
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <p className="text-xs text-gray-400">Noch keine Medikamente hinzugefügt.</p>
      )}
    </div>
  );
}

// ─── Matrix Field ─────────────────────────────────────────────────────────────

function MatrixField({ field, value, onChange, accent }: {
  field: FormField; value: string; onChange: (v: string) => void; accent: string;
}) {
  const rows = field.rows ?? ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];
  const cols = field.columns ?? ["Vormittag", "Nachmittag"];

  // value is JSON: { "Montag|Vormittag": true, ... }
  const checked: Record<string, boolean> = (() => {
    try { return value ? JSON.parse(value) : {}; } catch { return {}; }
  })();

  function toggle(row: string, col: string) {
    const key = `${row}|${col}`;
    const next = { ...checked, [key]: !checked[key] };
    onChange(JSON.stringify(next));
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="pb-2 pr-3 text-left font-normal text-gray-400" />
            {cols.map((c) => (
              <th key={c} className="pb-2 px-2 text-center font-medium text-gray-700">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row} className={ri % 2 === 0 ? "bg-gray-50" : "bg-white"}>
              <td className="py-2 pr-3 font-semibold text-gray-800 whitespace-nowrap rounded-l-lg pl-2">{row}</td>
              {cols.map((col) => {
                const key = `${row}|${col}`;
                return (
                  <td key={col} className="py-2 px-2 text-center rounded-r-lg">
                    <input
                      type="checkbox"
                      checked={!!checked[key]}
                      onChange={() => toggle(row, col)}
                      style={{ accentColor: accent, width: 16, height: 16 }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Field Renderer ───────────────────────────────────────────────────────────

function FieldRenderer({ field, value, onChange, accent, showError }: {
  field: FormField; value: string; onChange: (v: string) => void; accent: string; showError?: boolean;
}) {
  const [sonstigesText, setSonstigesText] = useState("");

  if (field.type === "medication_list") {
    return <MedicationListField value={value} onChange={onChange} accent={accent} />;
  }
  if (field.type === "matrix") {
    return <MatrixField field={field} value={value} onChange={onChange} accent={accent} />;
  }

  if (field.type === "radio") {
    return (
      <div className="space-y-2">
        {(field.options ?? []).map((opt) => {
          const isOther = opt.toLowerCase().startsWith("sonstig");
          const isSelected = value === opt || (isOther && value.startsWith("Sonstiges:"));
          return (
            <div key={opt}>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio" name={field.id} value={opt}
                  checked={isSelected}
                  onChange={() => {
                    onChange(isOther ? (sonstigesText ? `Sonstiges: ${sonstigesText}` : opt) : opt);
                  }}
                  style={{ accentColor: accent }}
                />
                <span className="text-sm text-gray-800">{opt}</span>
              </label>
              {isOther && isSelected && (
                <input
                  className={`${BASE.input} mt-1.5 ml-6`}
                  placeholder="Bitte beschreiben …"
                  value={sonstigesText}
                  onChange={(e) => { setSonstigesText(e.target.value); onChange(`Sonstiges: ${e.target.value}`); }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }
  const errCls = showError && field.required && !value ? "border-red-400 focus:ring-red-200" : "";

  if (field.type === "select") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={`${BASE.input} ${errCls}`}>
        <option value="">Bitte wählen …</option>
        {(field.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }
  if (field.type === "textarea") {
    return <textarea value={value} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} className={`${BASE.input} ${errCls}`} rows={3} />;
  }
  if (field.type === "date") {
    return (
      <input
        type="date"
        value={value}
        min="1900-01-01"
        max="9999-12-31"
        onChange={(e) => {
          const v = e.target.value;
          if (v && (v.split("-")[0]?.length ?? 0) > 4) return;
          onChange(v);
        }}
        className={`${BASE.input} cursor-pointer [color-scheme:light] ${errCls}`}
      />
    );
  }
  return (
    <input
      type={field.type === "time" ? "time" : field.type === "number" ? "number" : "text"}
      value={value} placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)} className={`${BASE.input} ${errCls}`}
    />
  );
}

// ─── Form Tab ─────────────────────────────────────────────────────────────────

type FormPhase = "picker" | "steps" | "contact" | "uploading" | "success";

function FormTab({ config, location, contact, setContact }: {
  config: WidgetConfig; location: Location | null;
  contact: ContactData; setContact: (d: ContactData) => void;
}) {
  const [phase, setPhase] = useState<FormPhase>("picker");
  const [selectedType, setSelectedType] = useState<FormType | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [showStepErrors, setShowStepErrors] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const accent = config.accentColor;

  function canProceed(): boolean {
    const step = selectedType?.steps[stepIndex];
    if (!step) return true;
    return step.fields.filter((f) => f.required).every((f) => !!answers[f.id]);
  }
  function canSubmit(): boolean {
    return !!(contact.firstName && contact.lastName && !birthdateError(contact.birthdate, true) && contact.email && contact.phone && contact.privacyConsent);
  }

  async function submit() {
    setPhase("uploading");
    try {
      const fd = new FormData();
      fd.append("clientId", config.id);
      fd.append("formTypeId", selectedType?.id ?? "");
      fd.append("formTypeTitle", selectedType?.title ?? "");
      fd.append("answers", JSON.stringify(answers));
      fd.append("contact", JSON.stringify(contact));
      fd.append("location", JSON.stringify(location));
      files.forEach((f) => fd.append("files", f));
      await fetch(`/api/widget/${config.slug}/submit`, { method: "POST", body: fd });
    } catch {}
    setPhase("success");
  }

  if (phase === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <CheckCircle2 className="mb-3 size-12 text-green-500" />
        <p className="font-semibold text-gray-900">Anfrage eingegangen!</p>
        <p className="mt-1 text-sm text-gray-500">Sie erhalten in Kürze eine Bestätigung per E-Mail.</p>
        <button className={`${BASE.btnSm} mt-4 px-5 py-2`} {...btn(accent)}
          onClick={() => { setPhase("picker"); setSelectedType(null); setAnswers({}); setFiles([]); setStepIndex(0); }}>
          Neue Anfrage
        </button>
      </div>
    );
  }

  if (phase === "uploading") {
    return <div className="flex flex-col items-center justify-center py-10"><Loader2 className="mb-3 size-8 animate-spin" style={{ color: accent }} /><p className="text-sm text-gray-600">Anfrage wird gesendet …</p></div>;
  }

  // Picker
  if (phase === "picker" || !selectedType) {
    if (config.formSteps.length === 0) {
      return <div className="flex flex-col items-center justify-center py-10 text-center"><FileText className="mb-3 size-10 text-gray-200" /><p className="text-sm text-gray-500">Kein Formular konfiguriert.</p></div>;
    }
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-800">Was können wir für Sie tun?</p>
        <div className="grid grid-cols-2 gap-2">
          {config.formSteps.map((ft) => (
            <button key={ft.id} onClick={() => { setSelectedType(ft); setStepIndex(0); setPhase("steps"); }}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3.5 text-center hover:bg-gray-100 transition-colors">
              <span style={{ color: accent }}><FormIcon id={ft.icon} className="size-5" /></span>
              <span className="text-xs font-medium text-gray-800 leading-tight">{ft.title}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "contact") {
    return (
      <div className="flex flex-col flex-1 min-h-0 gap-3">
        {/* Header */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setPhase("steps")} className="text-gray-400 hover:text-gray-700"><ChevronLeft className="size-4" /></button>
          <p className="text-sm font-semibold text-gray-900">Kontaktdaten</p>
        </div>

        {/* Scrollable contact form */}
        <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: "thin" }}>
          <ContactStep config={config} data={contact} onChange={setContact} />
        </div>

        {/* File list (scrollable, max 3 rows visible) + add button */}
        <div className="shrink-0">
          {files.length > 0 && (
            <div className="mb-1 max-h-20 overflow-y-auto space-y-0.5" style={{ scrollbarWidth: "thin" }}>
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-gray-600">
                  <span className="truncate max-w-[260px]">{f.name}</span>
                  <button onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))} className="ml-2 shrink-0 text-gray-400 hover:text-red-500"><X className="size-3.5" /></button>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800">
            <Paperclip className="size-3.5" />
            Dateien/Fotos hinzufügen{files.length > 0 ? ` (${files.length})` : ""}
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden"
            onChange={(e) => setFiles((f) => [...f, ...Array.from(e.target.files ?? [])])} />
        </div>

        {/* Always-visible submit */}
        <div className="shrink-0 space-y-1">
          <button className={`${BASE.btnSm} w-full py-2.5`} {...btn(accent)} disabled={!canSubmit()} onClick={submit}>
            Absenden
          </button>
          {!canSubmit() && <p className="text-center text-xs text-gray-400">Alle Pflichtfelder ausfüllen und Datenschutz akzeptieren</p>}
        </div>
      </div>
    );
  }

  // Steps
  const step = selectedType.steps[stepIndex];
  if (!step) { setPhase("contact"); return null; }
  const total = selectedType.steps.length + 1;

  function tryAdvance() {
    if (!canProceed()) { setShowStepErrors(true); return; }
    setShowStepErrors(false);
    if (stepIndex < selectedType!.steps.length - 1) setStepIndex((i) => i + 1);
    else setPhase("contact");
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      {/* Progress + title (fixed) */}
      <div className="shrink-0 space-y-2">
        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-400">
            <span>{selectedType.title}</span>
            <span>{stepIndex + 1}/{total}</span>
          </div>
          <div className="h-1 rounded-full bg-gray-100"><div className="h-full rounded-full transition-all" style={{ width: `${((stepIndex + 1) / total) * 100}%`, background: config.accentColor }} /></div>
        </div>
        <p className="text-sm font-semibold text-gray-900">{step.title}</p>
        {step.subtitle && <p className="text-xs text-gray-500 -mt-1">{step.subtitle}</p>}
      </div>

      {/* Scrollable fields */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-4" style={{ scrollbarWidth: "thin" }}>
        {step.fields.map((f) => {
          const hasErr = showStepErrors && f.required && !answers[f.id];
          return (
            <div key={f.id}>
              <label className={`block text-xs font-medium mb-1 ${hasErr ? "text-red-600" : "text-gray-700"}${f.required ? " after:ml-0.5 after:text-red-400 after:content-['*']" : ""}`}>{f.label}</label>
              <FieldRenderer field={f} value={answers[f.id] ?? ""} onChange={(v) => { setAnswers((a) => ({ ...a, [f.id]: v })); if (showStepErrors) setShowStepErrors(false); }} accent={config.accentColor} showError={showStepErrors} />
              {hasErr && <p className="mt-0.5 text-xs text-red-500">Pflichtfeld</p>}
            </div>
          );
        })}
      </div>

      {/* File upload – fixed above nav buttons */}
      <div className="shrink-0">
        {files.length > 0 && (
          <div className="mb-1 max-h-20 overflow-y-auto space-y-0.5" style={{ scrollbarWidth: "thin" }}>
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-gray-600">
                <span className="truncate max-w-[260px]">{f.name}</span>
                <button onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))} className="ml-2 shrink-0 text-gray-400 hover:text-red-500"><X className="size-3.5" /></button>
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800">
          <Paperclip className="size-3.5" />
          Dateien/Fotos hinzufügen{files.length > 0 ? ` (${files.length})` : ""}
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden"
          onChange={(e) => setFiles((f) => [...f, ...Array.from(e.target.files ?? [])])} />
      </div>

      {/* Nav buttons (always visible) */}
      <div className="shrink-0 flex gap-2">
        <button className={BASE.btnSmOut} onClick={() => { setShowStepErrors(false); stepIndex > 0 ? setStepIndex((i) => i - 1) : (setPhase("picker"), setSelectedType(null)); }}>
          <ChevronLeft className="inline size-3.5" /> Zurück
        </button>
        <button className={`${BASE.btnSm} flex-1`} {...btn(config.accentColor)} onClick={tryAdvance}>
          {stepIndex < selectedType.steps.length - 1 ? <span>Weiter <ChevronRight className="inline size-3.5" /></span> : "Kontaktdaten"}
        </button>
      </div>
    </div>
  );
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────

type ChatPhase = "contact" | "connecting" | "active";
type ChatMessage = { role: "user" | "agent" | "system"; text: string };

function ChatTab({ config, location, contact, setContact, onOpenForm }: {
  config: WidgetConfig; location: Location | null;
  contact: ContactData; setContact: (d: ContactData) => void;
  onOpenForm: () => void;
}) {
  const [phase, setPhase] = useState<ChatPhase>("contact");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatEnded, setChatEnded] = useState(false);
  const [input, setInput] = useState("");
  const [agentTyping, setAgentTyping] = useState(false);
  const [debugError, setDebugError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const accent = config.accentColor;

  // keep ref in sync for use inside ws callbacks
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentTyping]);

  function canStart() {
    return !!(contact.firstName && contact.lastName && !birthdateError(contact.birthdate, true) && contact.email && contact.phone && contact.privacyConsent);
  }

  async function startChat() {
    if (!config.elevenLabsAgentId) return;
    setPhase("connecting");
    setDebugError(null);
    setChatEnded(false);

    setMessages([]);

    try {
      const res = await fetch("/api/elevenlabs/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId: config.elevenLabsAgentId }),
      });
      const rawText = await res.text();
      let body: Record<string, unknown> = {};
      try { body = rawText ? JSON.parse(rawText) : {}; } catch { body = { error: rawText }; }
      if (!res.ok) {
        setDebugError(`Session API ${res.status}: ${body?.error ?? rawText}`);
        setPhase("contact");
        return;
      }
      const signedUrl = body.token as string;
      if (!signedUrl) {
        setDebugError("Kein signedUrl in API-Antwort erhalten");
        setPhase("contact");
        return;
      }

      const ws = new WebSocket(signedUrl);
      wsRef.current = ws;

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as Record<string, unknown>;
          const type = msg.type as string;

          // Send contact context once server is ready
          if (type === "conversation_initiation_metadata") {
            const fullPhone = `${contact.countryCode} ${contact.phone}`;
            ws.send(JSON.stringify({
              type: "conversation_initiation_client_data",
              dynamic_variables: {
                user_first_name: contact.firstName,
                user_last_name:  contact.lastName,
                user_email:      contact.email,
                user_phone:      fullPhone,
                user_birthdate:  contact.birthdate ?? "",
              },
              conversation_config_override: {
                agent: {
                  prompt: {
                    prompt: [
                      `Der Patient heisst ${contact.firstName} ${contact.lastName}.`,
                      contact.birthdate ? `Geburtsdatum: ${contact.birthdate}.` : "",
                      `E-Mail: ${contact.email}.`,
                      `Telefon: ${fullPhone}.`,
                      contact.forSelf === "proxy" && contact.proxyName
                        ? `Vertretung für: ${contact.proxyName}${contact.proxyBirthdate ? ` (*${contact.proxyBirthdate})` : ""}.`
                        : "",
                      "Frage nicht nach diesen Kontaktdaten, da sie bereits bekannt sind.",
                    ].filter(Boolean).join(" "),
                  },
                },
              },
            }));

            // Send contact info as first user message so agent processes it in conversation
            const contactMsg = [
              `Meine Daten: Vorname: ${contact.firstName}, Nachname: ${contact.lastName}`,
              contact.birthdate ? `Geburtsdatum: ${contact.birthdate}` : null,
              `E-Mail: ${contact.email}`,
              `Telefon: ${fullPhone}`,
              contact.forSelf === "proxy" && contact.proxyName
                ? `Vertretung für: ${contact.proxyName}${contact.proxyBirthdate ? `, Geburtsdatum: ${contact.proxyBirthdate}` : ""}`
                : null,
            ].filter(Boolean).join(", ");
            ws.send(JSON.stringify({ type: "user_message", text: contactMsg }));
            setMessages([{ role: "user", text: contactMsg }]);
            setAgentTyping(true);
            setPhase("active");
            return;
          }

          if (type === "ping") {
            const pingEvent = msg.ping_event as Record<string, unknown> | undefined;
            ws.send(JSON.stringify({ type: "pong", event_id: pingEvent?.event_id }));
            return;
          }

          if (type === "agent_response") {
            const ev2 = msg.agent_response_event as Record<string, unknown> | undefined;
            const text = (ev2?.agent_response ?? ev2?.text ?? "") as string;
            if (text) {
              setAgentTyping(false);
              setMessages((m) => [...m, { role: "agent", text }]);
              if (text.includes("[OPEN_FORM]")) onOpenForm();
            }
          }

          if (type === "agent_response_correction") {
            const ev2 = msg.agent_response_correction_event as Record<string, unknown> | undefined;
            const text = (ev2?.corrected_agent_response ?? "") as string;
            if (text) {
              setMessages((m) => {
                const copy = [...m];
                const last = copy.findLastIndex((x) => x.role === "agent");
                if (last >= 0) copy[last] = { role: "agent", text };
                return copy;
              });
            }
          }

          if (type === "interruption") setAgentTyping(false);
        } catch {}
      };

      ws.onopen = () => {
        // conversation_initiation_metadata triggers the context send
      };

      ws.onerror = () => {
        setDebugError("WebSocket-Verbindungsfehler");
        setPhase("contact");
      };

      ws.onclose = () => {
        setAgentTyping(false);
        setMessages((m) => [...m, { role: "system", text: "Chat wurde beendet." }]);
        setChatEnded(true);

        const msgs = messagesRef.current;
        const transcript = msgs
          .filter((m) => m.role !== "system")
          .map((m) => `${m.role === "user" ? "Patient" : "Assistent"}: ${m.text}`)
          .join("\n");

        const c = contact;
        const plainText = [
          "=== CHAT-PROTOKOLL ===",
          `Datum: ${new Date().toLocaleString("de-CH")}`,
          `Standort: ${location?.name ?? "–"}`,
          "",
          "--- Kontaktdaten ---",
          `Name: ${c.firstName} ${c.lastName}`,
          c.birthdate ? `Geburtsdatum: ${c.birthdate}` : null,
          `E-Mail: ${c.email}`,
          `Telefon: ${c.countryCode} ${c.phone}`,
          c.forSelf === "proxy" && c.proxyName
            ? `Vertretung für: ${c.proxyName}${c.proxyBirthdate ? ` (*${c.proxyBirthdate})` : ""}`
            : null,
          "",
          "--- Gesprächsverlauf ---",
          transcript || "(kein Verlauf)",
        ].filter((l) => l !== null).join("\n");

        fetch(`/api/widget/${config.slug}/submit`, {
          method: "POST",
          headers: { "content-type": "text/plain; charset=utf-8" },
          body: plainText,
        }).catch(() => {});
      };
    } catch (e) {
      setDebugError(e instanceof Error ? e.message : String(e));
      setPhase("contact");
    }
  }

  function sendMessage() {
    const text = input.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "user_message", text }));
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setAgentTyping(true);
  }

  function endChat() {
    wsRef.current?.close();
    wsRef.current = null;
  }

  function resetChat() {
    wsRef.current = null;
    setMessages([]);
    setChatEnded(false);
    setInput("");
    setPhase("contact");
  }

  // ── Screens ──────────────────────────────────────────────────────────────────

  if (!config.elevenLabsAgentId) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <MessageCircle className="mb-3 size-10 text-gray-200" />
        <p className="text-sm text-gray-500">Chat ist noch nicht konfiguriert.</p>
      </div>
    );
  }

  if (phase === "connecting") {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="mb-3 size-8 animate-spin" style={{ color: accent }} />
        <p className="text-sm text-gray-600">Verbindung wird aufgebaut …</p>
      </div>
    );
  }

  if (phase === "contact") {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900">Ihre Kontaktdaten</p>
        <p className="text-xs text-gray-500">Bevor der Chat startet, benötigen wir kurz Ihre Angaben.</p>
        <div className="overflow-y-auto" style={{ maxHeight: 300, scrollbarWidth: "thin" }}>
          <ContactStep config={config} data={contact} onChange={setContact} />
        </div>
        <div className="flex gap-2">
          <button className={`${BASE.btnSm} w-full`} {...btn(accent)} disabled={!canStart()} onClick={startChat}>Chat starten</button>
        </div>
      </div>
    );
  }

  if (phase === "active") {
    return (
      <div className="flex flex-col" style={{ height: 420 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <p className="text-sm font-semibold text-gray-900">Assistent</p>
          {!chatEnded && (
            <button className={`${BASE.btnSmOut} text-xs px-2 py-1`} onClick={endChat}>Beenden</button>
          )}
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0" style={{ scrollbarWidth: "thin" }}>
          {messages.every((m) => m.role === "system") && (
            <p className="text-center text-xs text-gray-400 pt-2">Assistent schreibt gleich …</p>
          )}
          {messages.map((m, i) => {
            if (m.role === "system") {
              return (
                <div key={i} className="flex justify-center py-1">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-400">{m.text}</span>
                </div>
              );
            }
            return (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                    m.role === "user"
                      ? "text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-900 rounded-bl-sm"
                  }`}
                  style={m.role === "user" ? { backgroundColor: accent } : undefined}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
          {agentTyping && (
            <div className="flex justify-start">
              <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2.5">
                <span className="size-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="size-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="size-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area — swaps to restart button when chat ended */}
        {chatEnded ? (
          <button
            className={`${BASE.btnSm} mt-2 w-full py-2.5 shrink-0`}
            {...btn(accent)}
            onClick={resetChat}
          >
            Neues Gespräch starten
          </button>
        ) : (
          <div className="flex gap-2 mt-2 shrink-0">
            <input
              className={`${BASE.input} flex-1`}
              placeholder="Nachricht eingeben …"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            />
            <button
              className="shrink-0 flex size-9 items-center justify-center rounded-lg text-white transition-opacity disabled:opacity-40"
              style={{ backgroundColor: accent }}
              disabled={!input.trim()}
              onClick={sendMessage}
            >
              <Send className="size-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ─── Home Tab ─────────────────────────────────────────────────────────────────

function HomeTab({ config, location, onOpenForm, onOpenChat }: {
  config: WidgetConfig; location: Location | null;
  onOpenForm: () => void; onOpenChat: () => void;
}) {
  const accent = config.accentColor;
  return (
    <div className="space-y-5 overflow-y-auto" style={{ maxHeight: 450, scrollbarWidth: "thin" }}>
      {(config.fachrichtung || config.introText) && (
        <div>
          {config.fachrichtung && <p className="mb-1 text-xs font-semibold" style={{ color: accent }}>{config.fachrichtung}</p>}
          {config.introText && <p className="text-sm text-gray-700 leading-relaxed">{config.introText}</p>}
        </div>
      )}

      {/* CTAs */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onOpenForm}
          className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3.5 text-center hover:bg-gray-100 transition-colors">
          <Calendar className="size-5" style={{ color: accent }} />
          <span className="text-xs font-medium text-gray-800">Termin anfragen</span>
        </button>
        <button onClick={onOpenChat}
          className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3.5 text-center hover:bg-gray-100 transition-colors">
          <MessageCircle className="size-5" style={{ color: accent }} />
          <span className="text-xs font-medium text-gray-800">Direkt chatten</span>
        </button>
      </div>

      {/* Öffnungszeiten */}
      {location && (location.openingHoursText || location.openingHours.some((h) => !h.isClosed)) && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <Clock className="size-3.5" /> Öffnungszeiten
            {location.name !== "Hauptstandort" && <span className="text-gray-400">— {location.name}</span>}
          </div>
          {location.openingHoursText ? (
            <p className="text-xs text-gray-600 whitespace-pre-line">{location.openingHoursText}</p>
          ) : (
            <div className="space-y-0.5">
              {location.openingHours.map((h) => (
                <div key={h.dayOfWeek} className="flex text-xs">
                  <span className="w-20 shrink-0 text-gray-500">
                    {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][h.dayOfWeek]}
                  </span>
                  {h.isClosed ? <span className="text-gray-400">Geschlossen</span> : <span className="text-gray-700">{h.openTime} – {h.closeTime}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Kontakt */}
      {location && (location.phone || location.address) && (
        <div className="space-y-1.5">
          {location.phone && (
            <a href={`tel:${location.phone}`} className="flex items-center gap-2 text-xs text-gray-600 hover:underline">
              <span className="size-3.5">📞</span>{location.phone}
            </a>
          )}
          {location.address && (
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />{location.address}
            </div>
          )}
        </div>
      )}

      {/* News */}
      {config.news.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-700"><Newspaper className="size-3.5" />Aktuelles</div>
          {config.news.map((n) => (
            <div key={n.id} className="mb-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-900">{n.title}</p>
              {n.body && <p className="mt-0.5 text-xs text-gray-600">{n.body}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

function WidgetPanel({ config, location, onClose, initialTab, contact, setContact }: {
  config: WidgetConfig; location: Location | null;
  onClose: () => void; initialTab: PanelTab;
  contact: ContactData; setContact: (d: ContactData) => void;
}) {
  const [activeTab, setActiveTab] = useState<PanelTab>(initialTab);
  const accent = config.accentColor;

  useEffect(() => { setActiveTab(initialTab); }, [initialTab]);

  const TABS: { id: PanelTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "home",     label: "Home",    Icon: House },
    { id: "formular", label: "Formular", Icon: FileText },
    ...(config.elevenLabsAgentId ? [{ id: "chat" as PanelTab, label: "Chat", Icon: MessageCircle }] : []),
  ];

  return (
    <div className="flex w-full sm:w-[420px] flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-gray-200 bg-white shadow-2xl" style={{ maxHeight: "min(750px, 90dvh)" }}>
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-gray-100 px-4 py-3">
        <LogoMark config={config} size={8} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{config.widgetTitle}</p>
          {config.widgetSubtitle && <p className="truncate text-xs text-gray-500">{config.widgetSubtitle}</p>}
        </div>
        <button onClick={onClose} className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
          <X className="size-4" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-gray-100">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              activeTab === id ? "border-b-2 text-gray-900" : "text-gray-400 hover:text-gray-700"
            }`}
            style={activeTab === id ? { borderBottomColor: accent, color: accent } : {}}>
            <Icon className="size-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 overflow-hidden px-5 py-5">
        {activeTab === "home" && (
          <HomeTab config={config} location={location}
            onOpenForm={() => setActiveTab("formular")}
            onOpenChat={() => setActiveTab("chat")} />
        )}
        <div className={activeTab === "formular" ? "flex flex-col flex-1 min-h-0" : "hidden"}>
          <FormTab config={config} location={location} contact={contact} setContact={setContact} />
        </div>
        {config.elevenLabsAgentId && (
          <div className={activeTab === "chat" ? "flex flex-col flex-1 min-h-0" : "hidden"}>
            <ChatTab config={config} location={location} contact={contact} setContact={setContact}
              onOpenForm={() => setActiveTab("formular")} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-gray-100 px-4 py-2.5">
        <div className="grid grid-cols-3 items-center text-[10px] text-gray-400">
          <a href="https://medflex-schweiz.ch/datenschutz" target="_blank" rel="noopener noreferrer"
            className="hover:text-gray-600 hover:underline">Datenschutz</a>
          <div className="flex items-center justify-center gap-1">
            <img src="/favicon.png" alt="MedFlex" className="size-3.5 opacity-60" />
            <span>MedFlex</span>
          </div>
          <a href="https://app.medflex.de/arzt" target="_blank" rel="noopener noreferrer"
            className="text-right hover:text-gray-600 hover:underline">Login</a>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

type WidgetView = "teaser" | "panel" | "collapsed";

export function WidgetApp({ config }: { config: WidgetConfig }) {
  const [view, setView] = useState<WidgetView>("teaser");
  const [privacyState, setPrivacyState] = useState<"pending" | "accepted" | "declined">("pending");
  const [locationSelected, setLocationSelected] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    config.locations.find((l) => l.isDefault) ?? config.locations[0] ?? null
  );
  const [initialTab, setInitialTab] = useState<PanelTab>("home");
  const [contact, setContact] = useState<ContactData>(EMPTY_CONTACT(config.defaultCountryCode));

  const accent = config.accentColor;
  const needsLocationSelect = config.locations.length > 1 && !locationSelected;

  // Remove dark class — layout CSS handles transparency and color-scheme
  useEffect(() => { document.documentElement.classList.remove("dark"); }, []);

  // Notify parent page to enable pointer-events when panel is open
  useEffect(() => {
    const isOpen = view === "panel";
    try { window.parent.postMessage({ type: "medflex-widget-open", open: isOpen }, "*"); } catch {}
  }, [view]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`reception_privacy_${config.slug}`);
      if (stored === "1") setPrivacyState("accepted");
    } catch {}
  }, [config.slug]);

  function openPanel(tab: PanelTab = "home") {
    if (privacyState !== "accepted") {
      // show privacy first — will open panel after accept
      setInitialTab(tab);
      setView("panel"); // open panel shell, privacy overlay will cover
      return;
    }
    setInitialTab(tab);
    setView("panel");
  }

  function acceptPrivacy() {
    try { localStorage.setItem(`reception_privacy_${config.slug}`, "1"); } catch {}
    setPrivacyState("accepted");
  }

  function declinePrivacy() {
    setPrivacyState("declined");
  }

  // Quick-action target handler
  function handleQA(target: string) {
    if (target === "CHAT") openPanel("chat");
    else openPanel("formular");
  }

  // ── Collapsed ──
  if (view === "collapsed") {
    return (
      <div className="fixed bottom-5 right-5" style={{ pointerEvents: "auto" }}>
        <button
          className="flex size-14 overflow-hidden rounded-full shadow-lg hover:shadow-xl transition-shadow"
          onClick={() => setView("teaser")}
          aria-label="Rezeption öffnen"
          style={!config.logoPath ? { background: config.accentColor } : {}}
        >
          <LogoMark config={config} size={14} round />
        </button>
      </div>
    );
  }

  // ── Panel ──
  if (view === "panel") {
    const showPrivacy = privacyState === "pending";
    const showDeclined = privacyState === "declined";
    const showLocation = privacyState === "accepted" && needsLocationSelect;

    return (
      <div className="fixed bottom-0 left-0 right-0 sm:bottom-5 sm:left-auto sm:right-5" style={{ pointerEvents: "auto" }}>
        <div className="relative">
          <WidgetPanel
            config={config}
            location={selectedLocation}
            onClose={() => setView("collapsed")}
            initialTab={initialTab}
            contact={contact}
            setContact={setContact}
          />
          {showPrivacy && (
            <PrivacyOverlay config={config} onAccept={acceptPrivacy} onDecline={declinePrivacy} />
          )}
          {showDeclined && (
            <PrivacyDeclinedScreen onAccept={() => { setPrivacyState("pending"); }} />
          )}
          {showLocation && (
            <LocationSelector locations={config.locations} onSelect={(loc) => { setSelectedLocation(loc); setLocationSelected(true); }} />
          )}
        </div>
      </div>
    );
  }

  // ── Teaser ──
  return (
    <div className="fixed bottom-0 left-0 right-0 flex flex-col items-end gap-2 p-4 sm:bottom-5 sm:left-auto sm:right-5 sm:p-0" style={{ pointerEvents: "auto" }}>
      {/* Quick-action buttons — icon only */}
      <div className="flex gap-1.5">
        {([
          { Icon: Calendar,      onClick: () => { setView("panel"); handleQA(config.qa1Target); } },
          { Icon: MessageCircle, onClick: () => { setView("panel"); handleQA(config.qa2Target); } },
          { Icon: MoreHorizontal, onClick: () => openPanel("home") },
        ] as { Icon: React.ComponentType<{ className?: string }>; onClick: () => void }[]).map(({ Icon, onClick }, i) => (
          <button key={i} onClick={onClick}
            className="flex size-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-colors">
            <Icon className="size-4 text-gray-600" />
          </button>
        ))}
      </div>

      {/* Main rectangle */}
      <div className="relative w-full sm:w-[420px]">
        <button
          className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-md hover:shadow-lg transition-shadow"
          onClick={() => openPanel("home")}
        >
          <div className="flex items-center gap-3 min-w-0">
            <LogoMark config={config} size={10} round />
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-semibold text-gray-900">{config.widgetTitle}</p>
              {config.widgetSubtitle && <p className="truncate text-xs text-gray-500">{config.widgetSubtitle}</p>}
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
    </div>
  );
}
