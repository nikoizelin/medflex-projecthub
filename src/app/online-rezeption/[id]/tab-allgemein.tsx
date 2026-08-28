"use client";

import { useState, useTransition, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { updateClientGeneral, uploadClientLogo, deleteClientLogo } from "./actions";
import type { ClientData } from "./client-config";

const QA_TARGETS = [
  { value: "TERMIN",         label: "Termin-Formular" },
  { value: "CHAT",           label: "Chat öffnen" },
  { value: "FORM_SONSTIGES", label: "Formular: Sonstiges" },
];

const COUNTRY_CODES = ["+41", "+49", "+43", "+33", "+39", "+44"];

export function TabAllgemein({ client }: { client: ClientData }) {
  const [form, setForm] = useState({
    widgetTitle:        client.widgetTitle || client.name,
    widgetSubtitle:     client.widgetSubtitle,
    defaultCountryCode: client.defaultCountryCode,
    privacyPolicyText:  client.privacyPolicyText,
    privacyPolicyUrl:   client.privacyPolicyUrl,
    qa1Label: client.qa1Label, qa1Target: client.qa1Target,
    qa2Label: client.qa2Label, qa2Target: client.qa2Target,
    qa3Label: client.qa3Label, qa3Target: client.qa3Target,
  });
  const [logoUrl, setLogoUrl] = useState(client.logoPath);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function save() {
    startTransition(async () => {
      await updateClientGeneral(client.id, form);
      setSaved(true);
    });
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setLogoUrl(preview);
    const fd = new FormData();
    fd.append("logo", file);
    startTransition(() => uploadClientLogo(client.id, fd));
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Logo */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">Logo</h2>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="group relative">
              <img
                src={logoUrl}
                alt="Logo"
                className="size-16 rounded-lg border object-contain p-1"
              />
              <button
                type="button"
                onClick={() => {
                  setLogoUrl("");
                  startTransition(() => deleteClientLogo(client.id));
                }}
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="flex size-16 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:border-foreground/40"
            >
              <Upload className="size-5" />
            </div>
          )}
          <div>
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              {logoUrl ? "Logo ändern" : "Logo hochladen"}
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, SVG — max. 2 MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
        </div>
      </section>

      {/* Widget-Text */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">Widget-Text</h2>
        <div className="space-y-3">
          <div>
            <Label htmlFor="widgetTitle">Titel</Label>
            <Input id="widgetTitle" value={form.widgetTitle} onChange={(e) => set("widgetTitle", e.target.value)} className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">Wird auf dem Widget-Hauptrechteck angezeigt.</p>
          </div>
          <div>
            <Label htmlFor="widgetSubtitle">Subtitel (optional)</Label>
            <Input id="widgetSubtitle" value={form.widgetSubtitle} placeholder="z. B. Ihr direkter Weg zu uns" onChange={(e) => set("widgetSubtitle", e.target.value)} className="mt-1" />
          </div>
        </div>
      </section>

      {/* Quick-Actions */}
      <section>
        <h2 className="mb-1 text-sm font-semibold">Quick-Action-Buttons</h2>
        <p className="mb-3 text-xs text-muted-foreground">Die 3 Schaltflächen oberhalb des Widgets.</p>
        <div className="space-y-3">
          {([1, 2, 3] as const).map((n) => (
            <div key={n} className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs">Button {n} — Label</Label>
                <Input
                  value={form[`qa${n}Label` as keyof typeof form]}
                  onChange={(e) => set(`qa${n}Label`, e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="w-48">
                <Label className="text-xs">Ziel</Label>
                <Select
                  value={form[`qa${n}Target` as keyof typeof form]}
                  onValueChange={(v) => v && set(`qa${n}Target`, v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QA_TARGETS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ländercode */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">Standard-Ländercode</h2>
        <Select value={form.defaultCountryCode} onValueChange={(v) => v && set("defaultCountryCode", v)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_CODES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">Vorauswahl im Mobilnummer-Feld des Formulars.</p>
      </section>

      {/* Datenschutz */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">Datenschutz</h2>
        <div className="space-y-3">
          <div>
            <Label htmlFor="privacyText">Datenschutztext</Label>
            <Textarea
              id="privacyText"
              value={form.privacyPolicyText}
              placeholder="Mit der Nutzung dieser Rezeption stimmen Sie unserer Datenschutzerklärung zu."
              onChange={(e) => set("privacyPolicyText", e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="privacyUrl">Link zur Datenschutzerklärung (optional)</Label>
            <Input
              id="privacyUrl"
              value={form.privacyPolicyUrl}
              placeholder="https://ihre-praxis.ch/datenschutz"
              onChange={(e) => set("privacyPolicyUrl", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </section>

      <Button onClick={save} disabled={pending}>
        {pending ? "Speichert…" : saved ? "Gespeichert ✓" : "Speichern"}
      </Button>
    </div>
  );
}
