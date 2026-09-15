"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Search, Trash2 } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createProject, deleteProject, updateProjectPhase } from "../actions";

type ProjectStatus = "LAUFEND" | "PAUSIERT" | "ABGESCHLOSSEN";

interface ProjectListItem {
  id: string;
  name: string;
  status: ProjectStatus;
  color: string;
  ownerName: string;
  calculated: boolean;
  progress: number;
  phaseLabel: string;
  manualPhase: string | null;
}

interface UserItem {
  id: string;
  name: string;
}

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

const STATUS_FILTER_LABEL: Record<"alle" | ProjectStatus, string> = {
  alle: "Alle Status",
  ...STATUS_LABEL,
};

const COLUMNS = [
  { id: "vorbereitung", label: "Vorbereitung" },
  { id: "setup",        label: "Setup" },
  { id: "entwicklung",  label: "Entwicklung" },
  { id: "golive",       label: "Go-Live" },
  { id: "monitoring",   label: "Monitoring" },
  { id: "abgeschlossen",label: "Abgeschlossen" },
] as const;

type ColumnId = (typeof COLUMNS)[number]["id"];

// Maps drag target column → manualPhase value (null = auto/clear)
const COLUMN_TO_PHASE: Record<ColumnId, string | null> = {
  vorbereitung: null,
  setup:        "Setup",
  entwicklung:  "Entwicklung",
  golive:       "Go-Live",
  monitoring:   "Monitoring",
  abgeschlossen:"Abgeschlossen",
};

const MANUAL_PHASE_TO_COLUMN: Record<string, ColumnId> = {
  Vorbereitung: "vorbereitung",
  Setup:        "setup",
  Entwicklung:  "entwicklung",
  Schulung:     "entwicklung",
  "Go-Live":    "golive",
  Monitoring:   "monitoring",
  Abgeschlossen:"abgeschlossen",
};

function getColumnId(p: ProjectListItem): ColumnId {
  if (p.manualPhase && MANUAL_PHASE_TO_COLUMN[p.manualPhase]) {
    return MANUAL_PHASE_TO_COLUMN[p.manualPhase];
  }
  if (p.progress >= 100 || p.status === "ABGESCHLOSSEN") return "abgeschlossen";
  if (!p.calculated) return "vorbereitung";
  switch (p.phaseLabel) {
    case "Setup":        return "setup";
    case "Entwicklung":  return "entwicklung";
    case "Schulung":     return "entwicklung";
    case "Go-Live":      return "golive";
    case "Monitoring":   return "monitoring";
    default:             return "vorbereitung";
  }
}

// ── Draggable card ─────────────────────────────────────────────────────────

function DraggableCard({ project, isDragOverlay = false }: { project: ProjectListItem; isDragOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: project.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative cursor-grab rounded-md border bg-background p-3 shadow-sm transition-colors active:cursor-grabbing",
        isDragging && !isDragOverlay && "opacity-40",
        isDragOverlay && "rotate-1 shadow-lg",
        !isDragging && "hover:border-foreground/20"
      )}
      style={{ touchAction: "none" }}
    >
      {/* Link covers the card but drag takes priority */}
      {!isDragOverlay && (
        <Link
          href={`/projektplanung/projekte/${project.id}`}
          className="absolute inset-0 z-0"
          aria-label={`${project.name} öffnen`}
          draggable={false}
        />
      )}
      <div className="mb-1.5 flex items-center gap-1.5 pr-6">
        <span className="size-2 shrink-0 rounded-full" style={{ background: project.color }} />
        <p className="text-sm font-medium leading-tight">{project.name}</p>
      </div>
      <span className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium ${STATUS_BADGE_CLASS[project.status]}`}>
        {STATUS_LABEL[project.status]}
      </span>
      {project.calculated ? (
        <>
          <div className="mt-2 mb-1 h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: `${project.progress}%`, background: project.color }} />
          </div>
          <p className="text-xs text-muted-foreground">{project.progress}% &middot; {project.ownerName}</p>
        </>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">{project.ownerName}</p>
      )}
      {!isDragOverlay && <DeleteProjectButton projectId={project.id} projectName={project.name} />}
    </div>
  );
}

// ── Droppable column ───────────────────────────────────────────────────────

function DroppableColumn({
  col,
  projects,
}: {
  col: { id: ColumnId; label: string };
  projects: ProjectListItem[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border bg-muted/30 transition-colors",
        isOver && "border-blue-500/50 bg-blue-500/5"
      )}
    >
      <div className={cn("flex items-center gap-2 border-b bg-muted/60 px-3 py-2 transition-colors", isOver && "bg-blue-500/10")}>
        <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-foreground/70">
          {col.label}
        </span>
        {projects.length > 0 && (
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-background text-[10px] font-semibold text-muted-foreground">
            {projects.length}
          </span>
        )}
      </div>
      <div ref={setNodeRef} className="flex min-h-12 flex-col gap-2 p-2">
        {projects.map((p) => (
          <DraggableCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}

// ── Main overview ──────────────────────────────────────────────────────────

export function ProjectOverview({ projects, users }: { projects: ProjectListItem[]; users: UserItem[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"alle" | ProjectStatus>("alle");
  const [open, setOpen] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [activeProject, setActiveProject] = useState<ProjectListItem | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (status !== "alle" && p.status !== status) return false;
      return true;
    });
  }, [projects, search, status]);

  const byColumn = useMemo(() => {
    const map = new Map<ColumnId, ProjectListItem[]>();
    for (const col of COLUMNS) map.set(col.id, []);
    for (const p of filtered) map.get(getColumnId(p))!.push(p);
    return map;
  }, [filtered]);

  const handleDragStart = (event: DragStartEvent) => {
    const project = projects.find((p) => p.id === event.active.id);
    setActiveProject(project ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveProject(null);
    const { active, over } = event;
    if (!over) return;

    const projectId = active.id as string;
    const columnId = over.id as ColumnId;

    if (!(columnId in COLUMN_TO_PHASE)) return;

    const newPhase = COLUMN_TO_PHASE[columnId];
    startTransition(() => updateProjectPhase(projectId, newPhase));
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h1 className="flex-1 text-lg font-semibold">Projektübersicht</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Projekt hinzufügen
          </Button>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle>Neues Projekt</DialogTitle>
            </DialogHeader>
            <form
              action={async (formData) => {
                await createProject(formData);
                setOpen(false);
                setSelectedOwnerId("");
              }}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Projektname</Label>
                <Input id="name" name="name" placeholder="z. B. Klinik Lindenhof" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ownerId">Verantwortliche/r</Label>
                <input type="hidden" name="ownerId" value={selectedOwnerId} />
                <Select value={selectedOwnerId} onValueChange={(v) => v && setSelectedOwnerId(v)}>
                  <SelectTrigger>
                    <SelectValue>
                      {selectedOwnerId
                        ? users.find((u) => u.id === selectedOwnerId)?.name ?? "Auswählen…"
                        : "Aktueller Benutzer (Standard)"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aktueller Benutzer (Standard)</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" />}>Abbrechen</DialogClose>
                <Button type="submit">Projekt speichern</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative max-w-70 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Projekte durchsuchen..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-36">
            <SelectValue>{STATUS_FILTER_LABEL[status]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Status</SelectItem>
            <SelectItem value="LAUFEND">Laufend</SelectItem>
            <SelectItem value="PAUSIERT">Pausiert</SelectItem>
            <SelectItem value="ABGESCHLOSSEN">Abgeschlossen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Projekte gefunden.</p>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto pb-2">
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(200px, 1fr))` }}
            >
              {COLUMNS.map((col) => (
                <DroppableColumn
                  key={col.id}
                  col={col}
                  projects={byColumn.get(col.id) ?? []}
                />
              ))}
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {activeProject && <DraggableCard project={activeProject} isDragOverlay />}
          </DragOverlay>
        </DndContext>
      )}

      <p className="mt-3.5 text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "Projekt" : "Projekte"}
      </p>
    </div>
  );
}

function DeleteProjectButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 size-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
            aria-label={`${projectName} löschen`}
          />
        }
      >
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Projekt löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            &quot;{projectName}&quot; und alle zugehörigen Daten (Zeitplan, Checkliste)
            werden unwiderruflich gelöscht.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={() => startTransition(() => deleteProject(projectId))}
          >
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
