"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, FileDown, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { submitChangeRequests, type ChangeRequestEntry } from "../actions";

type Priority = "kritisch" | "hoch" | "mittel" | "niedrig";

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "kritisch", label: "Kritisch" },
  { value: "hoch", label: "Hoch" },
  { value: "mittel", label: "Mittel" },
  { value: "niedrig", label: "Niedrig" },
];

const PRIORITY_BADGE: Record<Priority, string> = {
  kritisch: "bg-red-500/10 text-red-700 dark:text-red-400",
  hoch: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  mittel: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  niedrig: "bg-slate-200/60 text-slate-600 dark:text-slate-400",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyEntry(): ChangeRequestEntry {
  return {
    kontaktperson: "",
    praxisKunde: "",
    datum: today(),
    prioritaet: "mittel",
    beschreibungProblem: "",
    linkAnfrage: "",
    fehlerhaftesVerhalten: "",
    erwartesVerhalten: "",
  };
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

export function ChangeRequestForm() {
  const [entries, setEntries] = useState<ChangeRequestEntry[]>([emptyEntry()]);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const update = (index: number, patch: Partial<ChangeRequestEntry>) => {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  };

  const addEntry = () => setEntries((prev) => [...prev, emptyEntry()]);

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await submitChangeRequests(entries);
      setSubmitted(true);
      setEntries([emptyEntry()]);
    });
  };

  const handleExportDocx = async () => {
    const { generateChangeRequestDocx } = await import("./docx-export");
    await generateChangeRequestDocx(entries);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-background py-16 text-center shadow-sm">
        <CheckCircle2 className="size-12 text-emerald-500" />
        <div>
          <p className="text-lg font-semibold">Anfrage erfolgreich übermittelt</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ihre Änderungsanfrage wurde gespeichert. Das MedFlex-Team wird sich bei Ihnen melden.
          </p>
        </div>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Neue Anfrage erstellen
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {entries.map((entry, i) => (
        <div
          key={i}
          className="relative rounded-xl border bg-background shadow-sm"
        >
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-[#064b91] text-[11px] font-semibold text-white">
                {i + 1}
              </span>
              <p className="text-sm font-medium">
                {entry.praxisKunde || entry.kontaktperson
                  ? [entry.praxisKunde, entry.kontaktperson].filter(Boolean).join(" · ")
                  : "Eintrag"}
              </p>
              {entry.prioritaet && (
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", PRIORITY_BADGE[entry.prioritaet as Priority])}>
                  {PRIORITY_OPTIONS.find((p) => p.value === entry.prioritaet)?.label}
                </span>
              )}
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
            <Field label="Kontaktperson" required>
              <Input
                value={entry.kontaktperson}
                onChange={(e) => update(i, { kontaktperson: e.target.value })}
                placeholder="Name der Kontaktperson"
                required
              />
            </Field>

            <Field label="Praxis / Kunde" required>
              <Input
                value={entry.praxisKunde}
                onChange={(e) => update(i, { praxisKunde: e.target.value })}
                placeholder="Name der Praxis oder des Kunden"
                required
              />
            </Field>

            <Field label="Datum">
              <Input
                type="date"
                value={entry.datum}
                onChange={(e) => update(i, { datum: e.target.value })}
              />
            </Field>

            <Field label="Priorität">
              <select
                value={entry.prioritaet}
                onChange={(e) => update(i, { prioritaet: e.target.value as Priority })}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Beschreibung des Problems" required>
                <Textarea
                  value={entry.beschreibungProblem}
                  onChange={(e) => update(i, { beschreibungProblem: e.target.value })}
                  placeholder="Was soll geändert werden oder was funktioniert nicht?"
                  rows={3}
                  required
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Link der Anfrage">
                <Input
                  type="url"
                  value={entry.linkAnfrage}
                  onChange={(e) => update(i, { linkAnfrage: e.target.value })}
                  placeholder="https://..."
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Fehlerhaftes Verhalten">
                <Textarea
                  value={entry.fehlerhaftesVerhalten}
                  onChange={(e) => update(i, { fehlerhaftesVerhalten: e.target.value })}
                  placeholder="Was passiert aktuell? Wie äussert sich das fehlerhafte Verhalten?"
                  rows={3}
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Erwartetes Verhalten">
                <Textarea
                  value={entry.erwartesVerhalten}
                  onChange={(e) => update(i, { erwartesVerhalten: e.target.value })}
                  placeholder="Was soll stattdessen passieren?"
                  rows={3}
                />
              </Field>
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

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleExportDocx}
        >
          <FileDown className="size-4" />
          Als Word-Dokument exportieren
        </Button>
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
