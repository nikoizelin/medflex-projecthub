"use client";

import { useOptimistic, useState, useTransition } from "react";
import { CalendarRange, FlaskConical, ListChecks, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PALETTE, PHASE_NAMES, getActivePhaseIndex } from "@/lib/schedule";
import {
  calculateProject,
  toggleChecklistItem,
  addChecklistItem,
  updateProject,
} from "../../actions";
import { TestingProtocol, type TestingEntry } from "./testing-protocol";

type ProjectStatus = "LAUFEND" | "PAUSIERT" | "ABGESCHLOSSEN";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  LAUFEND: "Laufend",
  PAUSIERT: "Pausiert",
  ABGESCHLOSSEN: "Abgeschlossen",
};

const STATUS_BADGE_CLASS: Record<ProjectStatus, string> = {
  LAUFEND: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  PAUSIERT: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  ABGESCHLOSSEN: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

const dateFormatter = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  order: number;
}

interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  color: string;
  ownerName: string;
  startDate: string | null;
  deadline: string | null;
  calculated: boolean;
  checklist: ChecklistItem[];
  testingEntries: TestingEntry[];
}

export function ProjectDetail({ project }: { project: Project }) {
  const [startDate, setStartDate] = useState(
    project.startDate ? project.startDate.slice(0, 10) : ""
  );
  const [newItem, setNewItem] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(project.name);
  const [checklist, applyOptimisticChecklist] = useOptimistic(
    project.checklist,
    (state: ChecklistItem[], action: { type: "toggle"; id: string; checked: boolean } | { type: "add"; item: ChecklistItem }) =>
      action.type === "toggle"
        ? state.map((c) => (c.id === action.id ? { ...c, checked: action.checked } : c))
        : [...state, action.item]
  );

  const saveName = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === project.name) {
      setName(project.name);
    } else {
      startTransition(() => updateProject(project.id, { name: trimmed }));
    }
    setIsEditingName(false);
  };

  const total = checklist.length;
  const checkedCount = checklist.filter((c) => c.checked).length;
  const progress = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
  const activePhase = getActivePhaseIndex(checklist);

  const allChecked = total > 0 && checkedCount === total;
  const displayStatus: ProjectStatus = allChecked
    ? "ABGESCHLOSSEN"
    : project.status === "ABGESCHLOSSEN"
      ? "LAUFEND"
      : project.status;

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="group flex items-center gap-2">
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="size-3.5 shrink-0 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-background transition-shadow hover:ring-foreground/20"
                    style={{ background: project.color }}
                    aria-label="Farbe ändern"
                  />
                }
              />
              <PopoverContent className="w-auto">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Farbe wählen</p>
                <div className="flex flex-wrap gap-1.5">
                  {PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "size-6 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-popover transition-shadow hover:ring-foreground/30",
                        color === project.color && "ring-foreground/60"
                      )}
                      style={{ background: color }}
                      aria-label={color}
                      onClick={() => startTransition(() => updateProject(project.id, { color }))}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {isEditingName ? (
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") {
                    setName(project.name);
                    setIsEditingName(false);
                  }
                }}
                className="h-8 text-lg font-semibold"
              />
            ) : (
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md px-1 -mx-1 text-left hover:bg-accent"
                onClick={() => setIsEditingName(true)}
              >
                <h1 className="text-lg font-semibold">{name}</h1>
                <Pencil className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Verantwortlich: {project.ownerName}
          </p>
        </div>
        <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-xs font-medium", STATUS_BADGE_CLASS[displayStatus])}>
          {STATUS_LABEL[displayStatus]}
          {project.calculated ? ` · ${progress}%` : ""}
        </span>
      </div>

      <Tabs defaultValue="zeitplan">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="zeitplan">
            <CalendarRange className="size-4" />
            Zeitplan
          </TabsTrigger>
          <TabsTrigger value="checkliste">
            <ListChecks className="size-4" />
            Checkliste
          </TabsTrigger>
          <TabsTrigger value="testing">
            <FlaskConical className="size-4" />
            Testing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="zeitplan" className="mt-3.5 flex flex-col gap-3.5">
          <div className="rounded-lg border bg-background p-3.5">
            <p className="mb-2.5 text-sm font-medium">Zeitplan berechnen</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-44"
              />
              <Button
                disabled={!startDate || isPending}
                onClick={() =>
                  startTransition(() => calculateProject(project.id, startDate))
                }
              >
                {project.calculated ? "Neu berechnen" : "Projekt berechnen"}
              </Button>
              {project.calculated && project.deadline && (
                <p className="ml-auto text-xs text-muted-foreground">
                  Deadline:{" "}
                  <span className="font-medium text-foreground">
                    {dateFormatter.format(new Date(project.deadline))}
                  </span>
                </p>
              )}
            </div>
            {!project.calculated && (
              <p className="mt-2.5 text-xs text-muted-foreground">
                Noch nicht berechnet – Startdatum wählen und auf &quot;Projekt
                berechnen&quot; klicken, um Zeitplan, Kalender-Einträge und
                Deadline zu erzeugen. Wochenenden (Sa/So) werden bei der
                Berechnung übersprungen.
              </p>
            )}
          </div>

          {project.calculated && (
            <div className="rounded-lg border bg-background p-3.5">
              <p className="mb-3 text-sm font-medium">Timeline</p>
              <div className="mb-1.5 flex items-center">
                {PHASE_NAMES.map((_, i) => (
                  <div key={i} className="flex flex-1 items-center last:flex-none">
                    <div
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                        i < activePhase && "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                        i === activePhase && "border-transparent bg-blue-500/15 font-medium text-blue-600 dark:text-blue-400",
                        i > activePhase && "text-muted-foreground"
                      )}
                    >
                      {i + 1}
                    </div>
                    {i < PHASE_NAMES.length - 1 && (
                      <div className={cn("h-0.5 flex-1", i < activePhase ? "bg-emerald-500" : "bg-border")} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                {PHASE_NAMES.map((name) => (
                  <span key={name}>{name}</span>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="checkliste" className="mt-3.5">
          <div className="rounded-lg border bg-background p-3.5">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Checkliste</p>
              <span className="text-xs text-muted-foreground">
                {checkedCount}/{total} erledigt
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-sm">
              {checklist.map((item) => (
                <label key={item.id} className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={(checked) => {
                      const isChecked = checked === true;
                      startTransition(async () => {
                        applyOptimisticChecklist({ type: "toggle", id: item.id, checked: isChecked });
                        await toggleChecklistItem(item.id, project.id, isChecked);
                      });
                    }}
                  />
                  <span className={item.checked ? "text-muted-foreground line-through" : ""}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-2.5 flex gap-2">
              <Input
                placeholder="Eigenen Punkt hinzufügen..."
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                className="flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  const value = newItem.trim();
                  if (!value) return;
                  setNewItem("");
                  startTransition(async () => {
                    applyOptimisticChecklist({
                      type: "add",
                      item: { id: `temp-${Date.now()}`, label: value, checked: false, order: total },
                    });
                    await addChecklistItem(project.id, value);
                  });
                }}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="testing" className="mt-3.5">
          <div className="rounded-lg border bg-background p-3.5">
            <TestingProtocol
              projectId={project.id}
              projectName={project.name}
              entries={project.testingEntries}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
