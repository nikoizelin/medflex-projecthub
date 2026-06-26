"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ChartBar, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createStatReport, deleteStatReport } from "../actions";

interface ReportListItem {
  id: string;
  title: string;
  period: string;
  updatedAt: string;
}

const dateFormatter = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function StatistikOverview({ reports }: { reports: ReportListItem[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h1 className="flex-1 text-lg font-semibold">Statistik Builder</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Neuer Report
          </Button>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle>Neuer Statistik-Report</DialogTitle>
            </DialogHeader>
            <form
              action={async (formData) => {
                const id = await createStatReport(formData);
                setOpen(false);
                if (id) router.push(`/statistik/${id}`);
              }}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Kundenname</Label>
                <Input id="title" name="title" placeholder="z. B. Klinik Lindenhof" required />
              </div>
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" />}>
                  Abbrechen
                </DialogClose>
                <Button type="submit">Report erstellen</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Reports erstellt.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {reports.map((r) => (
            <div
              key={r.id}
              className="group relative rounded-lg border bg-background p-3.5 transition-colors hover:border-foreground/20"
            >
              <Link
                href={`/statistik/${r.id}`}
                className="absolute inset-0 z-0"
                aria-label={`${r.title} öffnen`}
              />
              <div className="mb-1 flex items-center gap-1.5 pr-6">
                <ChartBar className="size-4 shrink-0 text-primary" />
                <p className="text-sm font-medium">{r.title}</p>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">{r.period || "Kein Zeitraum"}</p>
              <p className="text-xs text-muted-foreground">
                Zuletzt bearbeitet: {dateFormatter.format(new Date(r.updatedAt))}
              </p>

              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 z-10 size-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      aria-label={`${r.title} löschen`}
                    />
                  }
                >
                  <Trash2 className="size-4" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Report löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      &quot;{r.title}&quot; wird unwiderruflich gelöscht.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => startTransition(() => deleteStatReport(r.id))}
                    >
                      Löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
