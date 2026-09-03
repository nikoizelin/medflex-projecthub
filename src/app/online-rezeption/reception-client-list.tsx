"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, MonitorSmartphone } from "lucide-react";
import Link from "next/link";
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
import { createReceptionClient, deleteReceptionClient } from "./actions";

type Client = { id: string; name: string; slug: string; logoPath: string; _count: { locations: number } };

export function ClientCard({ client }: { client: Client }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <div className="group relative rounded-lg border bg-background p-4 transition-colors hover:border-foreground/20">
        <Link href={`/online-rezeption/${client.id}`} className="block">
          <div className="mb-3 flex items-center gap-3">
            {client.logoPath ? (
              <img src={`/api/reception-logo/${client.id}`} alt={client.name} className="size-10 rounded-md object-contain" />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                <MonitorSmartphone className="size-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-medium leading-tight">{client.name}</p>
              <p className="text-xs text-muted-foreground">
                {client._count.locations} {client._count.locations === 1 ? "Standort" : "Standorte"}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Widget-ID: <span className="font-mono">{client.slug}</span>
          </p>
        </Link>

        <button
          onClick={(e) => { e.preventDefault(); setConfirmOpen(true); }}
          className="absolute right-3 top-3 hidden rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:flex"
          title="Kunde löschen"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Kunde löschen?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{client.name}</span> und alle zugehörigen Daten (Standorte, Formulare, News) werden unwiderruflich gelöscht.
          </p>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Abbrechen
            </DialogClose>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => startTransition(async () => {
                await deleteReceptionClient(client.id);
                setConfirmOpen(false);
              })}
            >
              {pending ? "Löscht…" : "Endgültig löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ReceptionClientList({
  clients,
}: {
  clients: Client[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Kunde hinzufügen
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Neuer Kunde</DialogTitle>
          </DialogHeader>
          <form
            action={async (formData) => {
              setPending(true);
              const id = await createReceptionClient(formData);
              setPending(false);
              setOpen(false);
              if (id) router.push(`/online-rezeption/${id}`);
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Kundenname / Praxisname</Label>
              <Input
                id="name"
                name="name"
                placeholder="z. B. Praxis Muster"
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Abbrechen
              </DialogClose>
              <Button type="submit" disabled={pending}>
                {pending ? "Erstelle…" : "Erstellen & Konfigurieren"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
