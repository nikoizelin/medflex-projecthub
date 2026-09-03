"use client";

import { useState, useTransition, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateClientGeneral, uploadClientLogo, deleteClientLogo } from "./actions";
import type { ClientData } from "./client-config";

const ACCENT_PRESETS = [
  "#E30613", "#BF375F", "#BC358C", "#7A368D",
  "#283585", "#4B7E9C", "#009740", "#F07D00",
];

export function TabAllgemein({ client }: { client: ClientData }) {
  const [form, setForm] = useState({
    widgetTitle:        client.widgetTitle || client.name,
    widgetSubtitle:     client.widgetSubtitle,
    accentColor:        client.accentColor || "#E30613",
    defaultCountryCode: client.defaultCountryCode,
    privacyPolicyText:  client.privacyPolicyText,
    privacyPolicyUrl:   client.privacyPolicyUrl,
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
                onClick={() => { setLogoUrl(""); startTransition(() => deleteClientLogo(client.id)); }}
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
            <p className="mt-0.5 text-xs text-amber-600">
              ⚠ Supabase-Bucket muss auf «Public» gestellt sein (Storage → Policies)
            </p>
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
          </div>
          <div>
            <Label htmlFor="widgetSubtitle">Subtitel (optional)</Label>
            <Input id="widgetSubtitle" value={form.widgetSubtitle} placeholder="z. B. Ihr direkter Weg zu uns" onChange={(e) => set("widgetSubtitle", e.target.value)} className="mt-1" />
          </div>
        </div>
      </section>

      {/* Akzentfarbe */}
      <section>
        <h2 className="mb-1 text-sm font-semibold">Akzentfarbe</h2>
        <p className="mb-3 text-xs text-muted-foreground">Primärfarbe für Buttons, Icons und Highlights im Widget.</p>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("accentColor", c)}
                className="size-7 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  background: c,
                  borderColor: form.accentColor === c ? "#000" : "transparent",
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.accentColor}
              onChange={(e) => set("accentColor", e.target.value)}
              className="size-7 cursor-pointer rounded border"
            />
            <Input
              value={form.accentColor}
              onChange={(e) => set("accentColor", e.target.value)}
              className="w-28 font-mono text-sm"
              placeholder="#E30613"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
          <div className="size-4 rounded-full" style={{ background: form.accentColor }} />
          <span>Vorschau: </span>
          <button
            className="rounded-md px-2.5 py-1 text-xs text-white"
            style={{ background: form.accentColor }}
          >
            Termin anfragen
          </button>
        </div>
      </section>

      {/* Standard-Ländercode */}
      <section>
        <h2 className="mb-1 text-sm font-semibold">Standard-Ländercode</h2>
        <p className="mb-2 text-xs text-muted-foreground">Vorauswahl im Mobilnummer-Feld (Standard: +41).</p>
        <Input
          value={form.defaultCountryCode}
          onChange={(e) => set("defaultCountryCode", e.target.value)}
          className="w-28"
          placeholder="+41"
        />
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
