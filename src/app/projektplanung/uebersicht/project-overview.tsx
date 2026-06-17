"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Search, Trash2 } from "lucide-react";
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
import { createProject, deleteProject } from "../actions";

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

export function ProjectOverview({ projects }: { projects: ProjectListItem[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"alle" | ProjectStatus>("alle");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (status !== "alle" && p.status !== status) return false;
      return true;
    });
  }, [projects, search, status]);

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
              }}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Projektname</Label>
                <Input id="name" name="name" placeholder="z. B. Klinik Lindenhof" required />
              </div>
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" />}>
                  Abbrechen
                </DialogClose>
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
            <SelectItem value="ABGESCHLOSSEN">Abgeschlossen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Projekte gefunden.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group relative rounded-lg border bg-background p-3.5 transition-colors hover:border-foreground/20"
            >
              <Link
                href={`/projektplanung/projekte/${p.id}`}
                className="absolute inset-0 z-0"
                aria-label={`${p.name} öffnen`}
              />
              <div className="mb-1 flex items-center gap-1.5 pr-6">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: p.color }}
                />
                <p className="text-sm font-medium">{p.name}</p>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">
                {p.calculated ? `Phase: ${p.phaseLabel}` : "Noch nicht berechnet"}
              </p>
              <span
                className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium ${STATUS_BADGE_CLASS[p.status]}`}
              >
                {STATUS_LABEL[p.status]}
              </span>
              {p.calculated ? (
                <>
                  <div className="mt-2.5 mb-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p.progress}%`, background: p.color }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.progress}% &middot; {p.ownerName}
                  </p>
                </>
              ) : (
                <p className="mt-2.5 text-xs text-muted-foreground">{p.ownerName}</p>
              )}

              <DeleteProjectButton projectId={p.id} projectName={p.name} />
            </div>
          ))}
        </div>
      )}

      <p className="mt-3.5 text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "Projekt" : "Projekte"}
      </p>
    </div>
  );
}

function DeleteProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
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
