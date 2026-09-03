"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateFormSteps } from "./actions";
import { FORM_TEMPLATES, type FormType, type FormStep, type FormField, type FieldType } from "@/lib/reception-form-templates";
import type { ClientData } from "./client-config";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text",            label: "Kurztext" },
  { value: "textarea",        label: "Langtext" },
  { value: "select",          label: "Dropdown" },
  { value: "radio",           label: "Auswahl (Radio)" },
  { value: "date",            label: "Datum" },
  { value: "time",            label: "Uhrzeit" },
  { value: "number",          label: "Zahl" },
  { value: "medication_list", label: "Medikamentenliste" },
];

function uid() { return Math.random().toString(36).slice(2, 9); }

// ─── Field Editor ────────────────────────────────────────────────────────────

function FieldEditor({ field, onChange, onDelete }: {
  field: FormField; onChange: (f: FormField) => void; onDelete: () => void;
}) {
  const hasOptions = field.type === "select" || field.type === "radio";
  return (
    <div className="rounded-md border bg-muted/20 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <GripVertical className="mt-2 size-4 shrink-0 text-muted-foreground" />
        <div className="flex-1 grid gap-2 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Feld-ID</Label>
            <Input value={field.id} onChange={(e) => onChange({ ...field, id: e.target.value.replace(/\s/g, "-") })} className="mt-0.5 h-7 text-xs font-mono" />
          </div>
          <div>
            <Label className="text-xs">Typ</Label>
            <Select value={field.type} onValueChange={(v) => v && onChange({ ...field, type: v as FieldType })}>
              <SelectTrigger className="mt-0.5 h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{FIELD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Label</Label>
            <Input value={field.label} onChange={(e) => onChange({ ...field, label: e.target.value })} className="mt-0.5 h-7 text-xs" />
          </div>
          {(field.type === "text" || field.type === "textarea") && (
            <div className="sm:col-span-2">
              <Label className="text-xs">Platzhalter (optional)</Label>
              <Input value={field.placeholder ?? ""} onChange={(e) => onChange({ ...field, placeholder: e.target.value })} className="mt-0.5 h-7 text-xs" />
            </div>
          )}
          {hasOptions && (
            <div className="sm:col-span-2">
              <Label className="text-xs">Optionen (eine pro Zeile)</Label>
              <textarea
                value={(field.options ?? []).join("\n")}
                onChange={(e) => onChange({ ...field, options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
                className="mt-0.5 w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                rows={3}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Checkbox checked={field.required} onCheckedChange={(v) => onChange({ ...field, required: Boolean(v) })} id={`req-${field.id}`} />
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

// ─── Step Editor ─────────────────────────────────────────────────────────────

function StepEditor({ step, index, total, onChange, onDelete, onMove }: {
  step: FormStep; index: number; total: number;
  onChange: (s: FormStep) => void; onDelete: () => void; onMove: (dir: -1 | 1) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex flex-col gap-0.5">
          <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="text-muted-foreground disabled:opacity-30 hover:text-foreground"><ChevronUp className="size-3.5" /></button>
          <button type="button" disabled={index === total - 1} onClick={() => onMove(1)} className="text-muted-foreground disabled:opacity-30 hover:text-foreground"><ChevronDown className="size-3.5" /></button>
        </div>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="flex-1 text-left text-sm font-medium">
          Schritt {index + 1}: {step.title || "(kein Titel)"}
        </button>
        <button type="button" onClick={onDelete} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
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
              <FieldEditor key={f.id} field={f} onChange={(u) => { const fs = [...step.fields]; fs[i] = u; onChange({ ...step, fields: fs }); }} onDelete={() => onChange({ ...step, fields: step.fields.filter((_, idx) => idx !== i) })} />
            ))}
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...step, fields: [...step.fields, { id: uid(), type: "text", label: "Neues Feld", required: false }] })}>
            <Plus className="size-3.5" /> Feld hinzufügen
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Form Type Card ───────────────────────────────────────────────────────────

function FormTypeCard({ formType, onChange, onDelete }: {
  formType: FormType; onChange: (ft: FormType) => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  function addStep() {
    onChange({ ...formType, steps: [...formType.steps, { id: uid(), title: "Neuer Schritt", subtitle: "", fields: [] }] });
  }
  function updateStep(i: number, s: FormStep) {
    const steps = [...formType.steps]; steps[i] = s; onChange({ ...formType, steps });
  }
  function deleteStep(i: number) {
    onChange({ ...formType, steps: formType.steps.filter((_, idx) => idx !== i) });
  }
  function moveStep(i: number, dir: -1 | 1) {
    const steps = [...formType.steps]; [steps[i], steps[i + dir]] = [steps[i + dir], steps[i]]; onChange({ ...formType, steps });
  }

  return (
    <div className="rounded-xl border">
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="flex-1 text-left">
          <p className="text-sm font-semibold">{formType.title || "(kein Titel)"}</p>
          <p className="text-xs text-muted-foreground">{formType.steps.length} {formType.steps.length === 1 ? "Schritt" : "Schritte"}</p>
        </button>
        <button type="button" onClick={onDelete} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
        {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </div>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Bezeichnung (Kachel-Titel im Widget)</Label>
              <Input value={formType.title} onChange={(e) => onChange({ ...formType, title: e.target.value })} className="mt-0.5 h-7 text-xs" />
            </div>
            <div>
              <Label className="text-xs">ID (für Verarbeitung)</Label>
              <Input value={formType.id} onChange={(e) => onChange({ ...formType, id: e.target.value.replace(/\s/g, "-") })} className="mt-0.5 h-7 text-xs font-mono" />
            </div>
          </div>

          <div className="space-y-2">
            {formType.steps.map((s, i) => (
              <StepEditor
                key={s.id} step={s} index={i} total={formType.steps.length}
                onChange={(u) => updateStep(i, u)}
                onDelete={() => deleteStep(i)}
                onMove={(dir) => moveStep(i, dir)}
              />
            ))}
          </div>

          <Button type="button" size="sm" variant="outline" onClick={addStep}>
            <Plus className="size-3.5" /> Schritt hinzufügen
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Tab ─────────────────────────────────────────────────────────────────────

export function TabFormular({ client }: { client: ClientData }) {
  const [formTypes, setFormTypes] = useState<FormType[]>((client.formSteps as FormType[]) ?? []);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function addFromTemplate(templateId: string) {
    const tpl = FORM_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const newType: FormType = {
      id: tpl.id + "-" + uid(),
      title: tpl.label,
      icon: tpl.icon,
      steps: tpl.steps.map((s) => ({ ...s, id: uid(), fields: s.fields.map((f) => ({ ...f, id: uid() })) })),
    };
    setFormTypes((prev) => [...prev, newType]);
    setSaved(false);
  }

  function addBlank() {
    setFormTypes((prev) => [...prev, { id: uid(), title: "Neue Anfrageart", icon: "file", steps: [] }]);
    setSaved(false);
  }

  function updateType(i: number, ft: FormType) {
    setFormTypes((prev) => { const next = [...prev]; next[i] = ft; return next; });
    setSaved(false);
  }

  function deleteType(i: number) {
    setFormTypes((prev) => prev.filter((_, idx) => idx !== i));
    setSaved(false);
  }

  function save() {
    startTransition(async () => {
      await updateFormSteps(client.id, formTypes);
      setSaved(true);
    });
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Vorlagen */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h2 className="mb-1 text-sm font-semibold">Vorlage hinzufügen</h2>
        <p className="mb-3 text-xs text-muted-foreground">Jede Vorlage wird als eigene Anfrageart (Kachel) hinzugefügt und kann danach angepasst werden.</p>
        <div className="flex flex-wrap gap-2">
          {FORM_TEMPLATES.map((t) => (
            <button key={t.id} type="button" onClick={() => addFromTemplate(t.id)}
              className="rounded-full border px-3 py-1 text-xs hover:bg-background hover:border-foreground/30 transition-colors">
              + {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formulartypen */}
      {formTypes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Anfragearten definiert. Vorlage hinzufügen oder leer starten.</p>
      ) : (
        <div className="space-y-3">
          {formTypes.map((ft, i) => (
            <FormTypeCard key={ft.id} formType={ft} onChange={(u) => updateType(i, u)} onDelete={() => deleteType(i)} />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={addBlank}>
          <Plus className="size-4" /> Leere Anfrageart
        </Button>
        <Button onClick={save} disabled={pending}>
          {pending ? "Speichert…" : saved ? "Gespeichert ✓" : "Formulare speichern"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {formTypes.length} {formTypes.length === 1 ? "Anfrageart" : "Anfragearten"} · Kontaktdaten werden automatisch als letzter Schritt eingeblendet.
      </p>
    </div>
  );
}
