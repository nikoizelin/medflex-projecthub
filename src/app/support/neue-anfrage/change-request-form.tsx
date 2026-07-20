"use client";

import { useState, useTransition, useRef } from "react";
import { CheckCircle2, ImagePlus, Info, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitSupportRequest, type ContactInfo, type ChangeRequestEntryInput } from "../actions";

const KATEGORIE_OPTIONS = [
  { value: "telefonassistent", label: "Telefonassistent" },
  { value: "medflex-app", label: "MedFlex App" },
  { value: "sonstiges", label: "Sonstiges" },
  { value: "featurewunsch", label: "Featurewunsch" },
];

const KATEGORIE_BADGE: Record<string, string> = {
  telefonassistent: "bg-blue-500/10 text-blue-700",
  "medflex-app": "bg-purple-500/10 text-purple-700",
  sonstiges: "bg-slate-500/10 text-slate-700",
  featurewunsch: "bg-emerald-500/10 text-emerald-700",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

interface ScreenshotState {
  file: File;
  preview: string;
}

interface EntryState {
  datum: string;
  kategorie: string;
  beschreibungProblem: string;
  linkAnfrage: string;
  fehlerhaftesVerhalten: string;
  erwartesVerhalten: string;
  screenshots: ScreenshotState[];
}

function emptyEntry(): EntryState {
  return {
    datum: today(),
    kategorie: "sonstiges",
    beschreibungProblem: "",
    linkAnfrage: "",
    fehlerhaftesVerhalten: "",
    erwartesVerhalten: "",
    screenshots: [],
  };
}

function Field({
  label,
  children,
  required,
  info,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  info?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        {info}
      </div>
      {children}
    </div>
  );
}

function LinkInfoTooltip() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="flex items-center text-muted-foreground hover:text-foreground"
        aria-label="Info zum MedFlex-Anfrage-Link"
      >
        <Info className="size-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-5 z-50 w-72 rounded-lg border bg-popover p-3 shadow-md text-xs text-popover-foreground">
          <p className="font-medium mb-1">So finden Sie den Link:</p>
          <p className="text-muted-foreground">
            Den genauen Erklärungstext bestimmen wir noch — bitte kurz leer lassen.
          </p>
        </div>
      )}
    </div>
  );
}

async function compressImage(file: File, maxWidth = 1400, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality).split(",")[1]);
    };
    img.src = url;
  });
}

export function ChangeRequestForm() {
  const [contact, setContact] = useState<ContactInfo>({
    kontaktperson: "",
    praxisKunde: "",
    email: "",
  });
  const [entries, setEntries] = useState<EntryState[]>([emptyEntry()]);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateContact = (patch: Partial<ContactInfo>) =>
    setContact((prev) => ({ ...prev, ...patch }));

  const updateEntry = (index: number, patch: Partial<EntryState>) =>
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  const addEntry = () => setEntries((prev) => [...prev, emptyEntry()]);
  const removeEntry = (index: number) =>
    setEntries((prev) => prev.filter((_, i) => i !== index));

  const addScreenshots = (index: number, files: FileList) => {
    const current = entries[index].screenshots;
    const remaining = 5 - current.length;
    if (remaining <= 0) return;
    const newFiles = Array.from(files).slice(0, remaining);
    const newScreenshots: ScreenshotState[] = newFiles.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
    }));
    updateEntry(index, { screenshots: [...current, ...newScreenshots] });
  };

  const removeScreenshot = (entryIndex: number, ssIndex: number) => {
    const updated = entries[entryIndex].screenshots.filter((_, i) => i !== ssIndex);
    updateEntry(entryIndex, { screenshots: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const preparedEntries: ChangeRequestEntryInput[] = await Promise.all(
        entries.map(async (entry) => {
          const screenshots = await Promise.all(
            entry.screenshots.map(async (ss) => ({
              filename: ss.file.name,
              mimeType: "image/jpeg",
              data: await compressImage(ss.file),
            }))
          );
          return {
            datum: entry.datum,
            kategorie: entry.kategorie,
            beschreibungProblem: entry.beschreibungProblem,
            linkAnfrage: entry.linkAnfrage,
            fehlerhaftesVerhalten: entry.fehlerhaftesVerhalten,
            erwartesVerhalten: entry.erwartesVerhalten,
            screenshots,
          };
        })
      );
      await submitSupportRequest(contact, preparedEntries);
      setSubmitted(true);
    });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-background py-16 text-center shadow-sm">
        <CheckCircle2 className="size-12 text-emerald-500" />
        <div>
          <p className="text-lg font-semibold">Anfrage erfolgreich übermittelt</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ihre Anfrage wurde gespeichert. Eine Bestätigung wurde an{" "}
            <span className="font-medium">{contact.email}</span> gesendet.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setSubmitted(false);
            setContact({ kontaktperson: "", praxisKunde: "", email: "" });
            setEntries([emptyEntry()]);
          }}
        >
          Neue Anfrage erstellen
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Kontaktbereich (einmalig) */}
      <div className="rounded-xl border bg-background shadow-sm">
        <div className="border-b px-5 py-3">
          <p className="text-sm font-semibold">Kontaktangaben</p>
          <p className="text-xs text-muted-foreground">
            Diese Angaben gelten für alle Einträge dieser Anfrage.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <Field label="Name Kontaktperson" required>
            <Input
              value={contact.kontaktperson}
              onChange={(e) => updateContact({ kontaktperson: e.target.value })}
              placeholder="Vor- und Nachname"
              required
            />
          </Field>
          <Field label="Praxis / Kunde" required>
            <Input
              value={contact.praxisKunde}
              onChange={(e) => updateContact({ praxisKunde: e.target.value })}
              placeholder="Name der Einrichtung"
              required
            />
          </Field>
          <Field label="E-Mail" required>
            <Input
              type="email"
              value={contact.email}
              onChange={(e) => updateContact({ email: e.target.value })}
              placeholder="name@praxis.ch"
              required
            />
          </Field>
        </div>
      </div>

      {/* Einträge */}
      {entries.map((entry, i) => (
        <div key={i} className="relative rounded-xl border bg-background shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-[#064b91] text-[11px] font-semibold text-white">
                {i + 1}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  KATEGORIE_BADGE[entry.kategorie] ?? "bg-muted text-muted-foreground"
                }`}
              >
                {KATEGORIE_OPTIONS.find((o) => o.value === entry.kategorie)?.label ??
                  entry.kategorie}
              </span>
            </div>
            {entries.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-muted-foreground hover:text-destructive"
                onClick={() => removeEntry(i)}
              >
                <Trash2 className="size-3.5" />
                Eintrag entfernen
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="Kategorie (was ist betroffen)" required>
              <Select
                value={entry.kategorie}
                onValueChange={(v) => v && updateEntry(i, { kategorie: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORIE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Datum">
              <Input
                type="date"
                value={entry.datum}
                onChange={(e) => updateEntry(i, { datum: e.target.value })}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Beschreibung des Problems" required>
                <Textarea
                  value={entry.beschreibungProblem}
                  onChange={(e) => updateEntry(i, { beschreibungProblem: e.target.value })}
                  placeholder="Was soll geändert werden oder was funktioniert nicht?"
                  rows={3}
                  required
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Link der MedFlex-Anfrage" info={<LinkInfoTooltip />}>
                <Input
                  type="url"
                  value={entry.linkAnfrage}
                  onChange={(e) => updateEntry(i, { linkAnfrage: e.target.value })}
                  placeholder="https://app.medflex.de/arzt/inbox/requests/…"
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Fehlerhaftes Verhalten">
                <Textarea
                  value={entry.fehlerhaftesVerhalten}
                  onChange={(e) =>
                    updateEntry(i, { fehlerhaftesVerhalten: e.target.value })
                  }
                  placeholder="Was passiert aktuell? Wie äussert sich das fehlerhafte Verhalten?"
                  rows={3}
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Erwartetes Verhalten">
                <Textarea
                  value={entry.erwartesVerhalten}
                  onChange={(e) => updateEntry(i, { erwartesVerhalten: e.target.value })}
                  placeholder="Was soll stattdessen passieren?"
                  rows={3}
                />
              </Field>
            </div>

            {/* Screenshots */}
            <div className="sm:col-span-2 flex flex-col gap-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Screenshots (max. 5)
              </Label>
              {entry.screenshots.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.screenshots.map((ss, si) => (
                    <div
                      key={si}
                      className="group relative size-20 overflow-hidden rounded-md border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ss.preview}
                        alt={ss.file.name}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(i, si)}
                        className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-background/90 opacity-0 shadow transition-opacity group-hover:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {entry.screenshots.length < 5 && (
                <>
                  <input
                    ref={(el) => {
                      fileInputRefs.current[i] = el;
                    }}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) addScreenshots(i, e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit border-dashed text-muted-foreground"
                    onClick={() => fileInputRefs.current[i]?.click()}
                  >
                    <ImagePlus className="size-4" />
                    Screenshot hinzufügen
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addEntry}
        className="w-full border-dashed"
      >
        <Plus className="size-4" />
        Weiterer Eintrag
      </Button>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Wird übermittelt…
            </>
          ) : (
            "Absenden"
          )}
        </Button>
      </div>
    </form>
  );
}
