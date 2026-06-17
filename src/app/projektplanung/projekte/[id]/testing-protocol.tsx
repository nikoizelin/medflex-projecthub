"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { createTestingEntry, deleteTestingEntry, updateTestingEntry } from "../../actions";

export interface TestingEntry {
  id: string;
  title: string;
  link: string;
  issue: string;
  comment: string;
}

type Action =
  | { type: "add"; entry: TestingEntry }
  | { type: "edit"; id: string; data: Omit<TestingEntry, "id"> }
  | { type: "delete"; id: string };

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function exportCsv(entries: TestingEntry[], projectName: string) {
  const header = ["Titel", "Link zur Anfrage", "Fehlerhaftes Verhalten", "Kommentar"];
  const rows = entries.map((e) => [e.title, e.link, e.issue, e.comment]);
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Testing-Protokoll_${projectName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function TestingProtocol({
  projectId,
  projectName,
  entries,
}: {
  projectId: string;
  projectName: string;
  entries: TestingEntry[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TestingEntry | null>(null);
  const [, startTransition] = useTransition();

  const [optimisticEntries, applyOptimistic] = useOptimistic(
    entries,
    (state: TestingEntry[], action: Action) => {
      switch (action.type) {
        case "add":
          return [...state, action.entry];
        case "edit":
          return state.map((e) => (e.id === action.id ? { id: e.id, ...action.data } : e));
        case "delete":
          return state.filter((e) => e.id !== action.id);
      }
    }
  );

  const closeForm = () => {
    setOpen(false);
    setEditing(null);
  };

  const submitForm = (formData: FormData) => {
    const data = {
      title: String(formData.get("title") ?? "").trim(),
      link: String(formData.get("link") ?? "").trim(),
      issue: String(formData.get("issue") ?? "").trim(),
      comment: String(formData.get("comment") ?? "").trim(),
    };
    if (!data.title) return;

    if (editing) {
      startTransition(async () => {
        applyOptimistic({ type: "edit", id: editing.id, data });
        await updateTestingEntry(editing.id, projectId, data);
      });
    } else {
      startTransition(async () => {
        applyOptimistic({ type: "add", entry: { id: `temp-${Date.now()}`, ...data } });
        await createTestingEntry(projectId, data);
      });
    }
    closeForm();
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Testing-Protokoll</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={optimisticEntries.length === 0}
            onClick={() => exportCsv(optimisticEntries, projectName)}
          >
            <Download className="size-4" />
            Exportieren (CSV)
          </Button>
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) setEditing(null);
            }}
          >
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Neuer Eintrag
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Eintrag bearbeiten" : "Neuer Eintrag"}</DialogTitle>
              </DialogHeader>
              <form
                key={editing?.id ?? "new"}
                action={submitForm}
                className="flex min-w-0 flex-col gap-3"
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="title">Titel</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editing?.title ?? ""}
                    placeholder="Kurzer Titel"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="link">Link zur Anfrage</Label>
                  <Input
                    id="link"
                    name="link"
                    defaultValue={editing?.link ?? ""}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="issue">Fehlerhaftes Verhalten</Label>
                  <Textarea
                    id="issue"
                    name="issue"
                    defaultValue={editing?.issue ?? ""}
                    placeholder="Was ist schiefgelaufen?"
                    rows={3}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="comment">Kommentar</Label>
                  <Textarea
                    id="comment"
                    name="comment"
                    defaultValue={editing?.comment ?? ""}
                    placeholder="Zusätzliche Anmerkungen..."
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <DialogClose render={<Button type="button" variant="outline" />}>
                    Abbrechen
                  </DialogClose>
                  <Button type="submit">{editing ? "Speichern" : "Eintrag erstellen"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {optimisticEntries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Einträge im Testing-Protokoll.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {optimisticEntries.map((entry) => (
            <div key={entry.id} className="rounded-lg border bg-background p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{entry.title}</p>
                  {entry.link && (
                    <a
                      href={entry.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-xs text-primary hover:underline"
                    >
                      {entry.link}
                    </a>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Eintrag bearbeiten"
                    onClick={() => {
                      setEditing(entry);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Eintrag löschen"
                        />
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          &quot;{entry.title}&quot; wird unwiderruflich aus dem Testing-Protokoll entfernt.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() =>
                            startTransition(async () => {
                              applyOptimistic({ type: "delete", id: entry.id });
                              await deleteTestingEntry(entry.id, projectId);
                            })
                          }
                        >
                          Löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {entry.issue && (
                <p className="mt-2 text-xs">
                  <span className="font-medium text-muted-foreground">Fehlerhaftes Verhalten: </span>
                  <span className="whitespace-pre-wrap wrap-anywhere">{entry.issue}</span>
                </p>
              )}
              {entry.comment && (
                <p className="mt-1 text-xs">
                  <span className="font-medium text-muted-foreground">Kommentar: </span>
                  <span className="whitespace-pre-wrap wrap-anywhere">{entry.comment}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
