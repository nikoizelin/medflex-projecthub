"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import { createReceptionClient } from "./actions";

export function ReceptionClientList({
  clients,
}: {
  clients: { id: string; name: string; slug: string; logoPath: string }[];
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
