"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { updateFormSteps } from "./actions";
import { FORM_TEMPLATES, type FormStep, type FormField, type FieldType } from "@/lib/reception-form-templates";
import type { ClientData } from "./client-config";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text",     label: "Kurztext" },
  { value: "textarea", label: "Langtext" },
  { value: "select",   label: "Dropdown" },
  { value: "radio",    label: "Auswahl (Radio)" },
  { value: "date",     label: "Datum" },
  { value: "time",     label: "Uhrzeit" },
  { value: "number",   label: "Zahl" },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function FieldEditor({
  field,
  onChange,
  onDelete,
}: {
  field: FormField;
  onChange: (f: FormField) => void;
  onDelete: () => void;
}) {
  const hasOptions = field.type === "select" || field.type === "radio";

  function setOptions(raw: string) {
    onChange({ ...field, options: raw.split("\n").map((s) => s.trim()).filter(Boolean) });
  }

  return (
    <div className="rounded-md border bg-muted/20 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <GripVertical className="mt-2 size-4 shrink-0 text-muted-foreground" />
        <div className="flex-1 grid gap-2 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Feld-ID</Label>
            <Input
              value={field.id}
              onChange={(e) => onChange({ ...field, id: e.target.value.replace(/\s/g, "-") })}
              className="mt-0.5 h-7 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs">Typ</Label>
            <Select value={field.type} onValueChange={(v) => v && onChange({ ...field, type: v as FieldType })}>
              <SelectTrigger className="mt-0.5 h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Label</Label>
            <Input
              value={field.label}
              onChange={(e) => onChange({ ...field, label: e.target.value })}
              className="mt-0.5 h-7 text-xs"
            />
          </div>
          {(field.type === "text" || field.type === "textarea") && (
            <div className="sm:col-span-2">
              <Label className="text-xs">Platzhalter (optional)</Label>
              <Input
                value={field.placeholder ?? ""}
                onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
                className="mt-0.5 h-7 text-xs"
              />
            </div>
          )}
          {hasOptions && (
            <div className="sm:col-span-2">
              <Label className="text-xs">Optionen (eine pro Zeile)</Label>
              <textarea
                value={(field.options ?? []).join("\n")}
                onChange={(e) => setOptions(e.target.value)}
                className="mt-0.5 w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                rows={3}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={field.required}
              onCheckedChange={(v) => onChange({ ...field, required: Boolean(v) })}
              id={`req-${field.id}`}
            />
            <label htmlFor={`req-${field.id}`} className="text-xs">Pflichtfeld</label>
          </div>
        </div>
        <button type="button" onClick={onDelete} className="mt-1 text-muted-foreground hover:text-destructive">
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

function StepEditor({
  step,
  index,
  total,
  onChange,
  onDelete,
  onMove,
}: {
  step: FormStep;
  index: number;
  total: number;
  onChange: (s: FormStep) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  function addField() {
    const field: FormField = { id: uid(), type: "text", label: "Neues Feld", required: false };
    onChange({ ...step, fields: [...step.fields, field] });
  }

  function updateField(i: number, f: FormField) {
    const fields = [...step.fields];
    fields[i] = f;
    onChange({ ...step, fields });
  }

  function deleteField(i: number) {
    onChange({ ...step, fields: step.fields.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex flex-col gap-0.5">
          <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="text-muted-foreground disabled:opacity-30 hover:text-foreground">
            <ChevronUp className="size-3.5" />
          </button>
          <button type="button" disabled={index === total - 1} onClick={() => onMove(1)} className="text-muted-foreground disabled:opacity-30 hover:text-foreground">
            <ChevronDown className="size-3.5" />
          </button>
        </div>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="flex-1 text-left text-sm font-medium">
          Schritt {index + 1}: {step.title || "(kein Titel)"}
        </button>
        <button type="button" onClick={onDelete} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="size-4" />
        </button>
      </div>

      {expanded && (
        <div className="border-t px-3 pb-3 pt-2 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Schritt-Titel</Label>
              <Input value={step.title} onChange={(e) => onChange({ ...step, title: e.target.value })} className="mt-0.5 h-7 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Schritt-Subtitel (optional)</Label>
              <Input value={step.subtitle ?? ""} onChange={(e) => onChange({ ...step, subtitle: e.target.value })} className="mt-0.5 h-7 text-xs" />
            </div>
          </div>

          <div className="space-y-2">
            {step.fields.map((f, i) => (
              <FieldEditor
                key={f.id}
                field={f}
                onChange={(updated) => updateField(i, updated)}
                onDelete={() => deleteField(i)}
              />
            ))}
          </div>

          <Button type="button" size="sm" variant="outline" onClick={addField}>
            <Plus className="size-3.5" />
            Feld hinzufügen
          </Button>
        </div>
      )}
    </div>
  );
}

export function TabFormular({ client }: { client: ClientData }) {
  const [steps, setSteps] = useState<FormStep[]>((client.formSteps as FormStep[]) ?? []);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function loadTemplate(templateId: string) {
    const tpl = FORM_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const cloned: FormStep[] = tpl.steps.map((s) => ({
      ...s,
      id: uid(),
      fields: s.fields.map((f) => ({ ...f, id: uid() })),
    }));
    setSteps(cloned);
    setSaved(false);
  }

  function addStep() {
    setSteps((prev) => [...prev, { id: uid(), title: "Neuer Schritt", subtitle: "", fields: [] }]);
    setSaved(false);
  }

  function updateStep(i: number, s: FormStep) {
    setSteps((prev) => { const next = [...prev]; next[i] = s; return next; });
    setSaved(false);
  }

  function deleteStep(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
    setSaved(false);
  }

  function moveStep(i: number, dir: -1 | 1) {
    setSteps((prev) => {
      const next = [...prev];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
    setSaved(false);
  }

  function save() {
    startTransition(async () => {
      await updateFormSteps(client.id, steps);
      setSaved(true);
    });
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Template-Auswahl */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h2 className="mb-1 text-sm font-semibold">Vorlage laden</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Wähle eine Vorlage als Ausgangspunkt. Das ersetzt das aktuelle Formular.
        </p>
        <div className="flex flex-wrap gap-2">
          {FORM_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => loadTemplate(t.id)}
              className="rounded-full border px-3 py-1 text-xs hover:bg-background hover:border-foreground/30 transition-colors"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schritte */}
      <div className="space-y-2">
        {steps.map((s, i) => (
          <StepEditor
            key={s.id}
            step={s}
            index={i}
            total={steps.length}
            onChange={(updated) => updateStep(i, updated)}
            onDelete={() => deleteStep(i)}
            onMove={(dir) => moveStep(i, dir)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={addStep}>
          <Plus className="size-4" />
          Schritt hinzufügen
        </Button>
        <Button onClick={save} disabled={pending}>
          {pending ? "Speichert…" : saved ? "Gespeichert ✓" : "Formular speichern"}
        </Button>
      </div>

      {steps.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {steps.length} {steps.length === 1 ? "Schritt" : "Schritte"} · Kontaktdaten werden automatisch als letzter Schritt hinzugefügt.
        </p>
      )}
    </div>
  );
}
