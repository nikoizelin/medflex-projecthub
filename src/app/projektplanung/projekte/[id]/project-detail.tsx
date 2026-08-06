"use client";

import { useOptimistic, useState, useTransition } from "react";
import { CalendarRange, FlaskConical, GripVertical, ListChecks, Pencil, Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PALETTE, PHASE_NAMES, getActivePhaseIndex } from "@/lib/schedule";
import {
  calculateProject,
  toggleChecklistItem,
  addChecklistItem,
  updateProject,
  reorderChecklistItems,
} from "../../actions";
import { TestingProtocol, type TestingEntry } from "./testing-protocol";
import { ProjectComments, type ProjectComment } from "./project-comments";

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

interface UserItem {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  color: string;
  ownerId: string;
  ownerName: string;
  startDate: string | null;
  deadline: string | null;
  calculated: boolean;
  checklist: ChecklistItem[];
  testingEntries: TestingEntry[];
  comments: ProjectComment[];
}

// ── Sortable checklist item ────────────────────────────────────────────────

function SortableChecklistItem({
  item,
  onToggle,
}: {
  item: ChecklistItem;
  onToggle: (id: string, checked: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="touch-none text-muted-foreground/40 hover:text-muted-foreground"
        aria-label="Verschieben"
      >
        <GripVertical className="size-4" />
      </button>
      <label className="flex flex-1 cursor-pointer items-center gap-2">
        <Checkbox
          checked={item.checked}
          onCheckedChange={(checked) => onToggle(item.id, checked === true)}
        />
        <span className={item.checked ? "text-muted-foreground line-through" : ""}>
          {item.label}
        </span>
      </label>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ProjectDetail({
  project,
  users,
  currentUserId,
  currentUserName,
  initialTab = "zeitplan",
}: {
  project: Project;
  users: UserItem[];
  currentUserId: string;
  currentUserName: string;
  initialTab?: string;
}) {
  const [startDate, setStartDate] = useState(
    project.startDate ? project.startDate.slice(0, 10) : ""
  );
  const [newItem, setNewItem] = useState("");
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(project.name);
  const [ownerId, setOwnerId] = useState(project.ownerId);
  const [ownerName, setOwnerName] = useState(project.ownerName);
  const [color, setColor] = useState(project.color);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editOwnerId, setEditOwnerId] = useState(project.ownerId);
  const [editColor, setEditColor] = useState(project.color);
  const [editStatus, setEditStatus] = useState<string>(
    project.status === "ABGESCHLOSSEN" ? "LAUFEND" : (project.status ?? "LAUFEND")
  );

  const [checklist, applyOptimisticChecklist] = useOptimistic(
    project.checklist,
    (
      state: ChecklistItem[],
      action:
        | { type: "toggle"; id: string; checked: boolean }
        | { type: "add"; item: ChecklistItem }
        | { type: "reorder"; items: ChecklistItem[] }
    ) => {
      if (action.type === "toggle")
        return state.map((c) => (c.id === action.id ? { ...c, checked: action.checked } : c));
      if (action.type === "add") return [...state, action.item];
      if (action.type === "reorder") return action.items;
      return state;
    }
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const openEdit = () => {
    setEditName(name);
    setEditOwnerId(ownerId);
    setEditColor(color);
    setEditStatus(project.status === "ABGESCHLOSSEN" ? "LAUFEND" : (project.status ?? "LAUFEND"));
    setIsEditing(true);
  };

  const saveEdit = () => {
    const trimmedName = editName.trim() || name;
    const newOwner = users.find((u) => u.id === editOwnerId);
    setName(trimmedName);
    setOwnerId(editOwnerId);
    setOwnerName(newOwner?.name ?? ownerName);
    setColor(editColor);
    setIsEditing(false);
    startTransition(() =>
      updateProject(project.id, {
        name: trimmedName,
        ownerId: editOwnerId,
        color: editColor,
        status: editStatus,
      })
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = checklist.findIndex((c) => c.id === active.id);
    const newIndex = checklist.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(checklist, oldIndex, newIndex).map((item, i) => ({
      ...item,
      order: i,
    }));

    startTransition(async () => {
      applyOptimisticChecklist({ type: "reorder", items: reordered });
      await reorderChecklistItems(
        project.id,
        reordered.map((c) => c.id)
      );
    });
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
          <div className="flex items-center gap-2">
            <span className="size-3.5 shrink-0 rounded-full" style={{ background: color }} />
            <h1 className="text-lg font-semibold">{name}</h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Verantwortlich: {ownerName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={openEdit} className="gap-1.5">
            <Pencil className="size-3.5" />
            Bearbeiten
          </Button>
          <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-xs font-medium", STATUS_BADGE_CLASS[displayStatus])}>
            {STATUS_LABEL[displayStatus]}
            {project.calculated ? ` · ${progress}%` : ""}
          </span>
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={(v) => !v && setIsEditing(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Projekt bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-1">
            <div className="flex flex-col gap-1.5">
              <Label>Projektname</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit()}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Farbe</Label>
              <div className="flex flex-wrap gap-1.5">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "size-6 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-background transition-shadow hover:ring-foreground/30",
                      c === editColor && "ring-foreground/60"
                    )}
                    style={{ background: c }}
                    aria-label={c}
                    onClick={() => setEditColor(c)}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Verantwortliche/r</Label>
              <Select value={editOwnerId} onValueChange={(v) => v && setEditOwnerId(v)}>
                <SelectTrigger>
                  <SelectValue>{users.find((u) => u.id === editOwnerId)?.name ?? ownerName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!allChecked && (
              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={(v) => v && setEditStatus(v)}>
                  <SelectTrigger>
                    <SelectValue>{editStatus === "LAUFEND" ? "Laufend" : "Pausiert"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAUFEND">Laufend</SelectItem>
                    <SelectItem value="PAUSIERT">Pausiert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Abbrechen
            </DialogClose>
            <Button onClick={saveEdit}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue={initialTab}>
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

          <ProjectComments
            projectId={project.id}
            comments={project.comments}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        </TabsContent>

        <TabsContent value="checkliste" className="mt-3.5">
          <div className="rounded-lg border bg-background p-3.5">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Checkliste</p>
              <span className="text-xs text-muted-foreground">
                {checkedCount}/{total} erledigt
              </span>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={checklist.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-1.5 text-sm">
                  {checklist.map((item) => (
                    <SortableChecklistItem
                      key={item.id}
                      item={item}
                      onToggle={(id, checked) => {
                        startTransition(async () => {
                          applyOptimisticChecklist({ type: "toggle", id, checked });
                          await toggleChecklistItem(id, project.id, checked);
                        });
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="mt-2.5 flex gap-2">
              <Input
                placeholder="Eigenen Punkt hinzufügen..."
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
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
                  }
                }}
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
