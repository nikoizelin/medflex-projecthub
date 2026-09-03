"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLocation, updateLocation, deleteLocation } from "./actions";
import type { ClientData } from "./client-config";

type Location = ClientData["locations"][number];

function LocationCard({ loc, clientId }: { loc: Location; clientId: string }) {
  const [expanded, setExpanded] = useState(true);
  const [form, setForm] = useState({
    name: loc.name,
    address: loc.address,
    phone: loc.phone,
    openingHoursText: loc.openingHoursText,
  });
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function save() {
    startTransition(async () => {
      await updateLocation(loc.id, clientId, form);
      setSaved(true);
    });
  }

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/30"
      >
        {form.name || "Standort"}
        {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Name des Standorts</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={form.phone} placeholder="+41 44 000 00 00" onChange={(e) => set("phone", e.target.value)} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Adresse</Label>
              <Input value={form.address} placeholder="Musterstrasse 1, 8001 Zürich" onChange={(e) => set("address", e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <Label>Öffnungszeiten</Label>
            <p className="mb-1 text-xs text-muted-foreground">Freitext, z. B. «Mo–Fr 08:00–12:00, 13:30–17:00 | Sa geschlossen»</p>
            <Textarea
              value={form.openingHoursText}
              placeholder={"Mo–Fr 08:00–12:00, 13:30–17:00\nSa–So geschlossen"}
              onChange={(e) => set("openingHoursText", e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button size="sm" onClick={save} disabled={pending}>
              {saved ? "Gespeichert ✓" : pending ? "Speichert…" : "Speichern"}
            </Button>
            <DeleteLocationButton locId={loc.id} clientId={clientId} />
          </div>
        </div>
      )}
    </div>
  );
}

function DeleteLocationButton({ locId, clientId }: { locId: string; clientId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-destructive hover:text-destructive"
      disabled={pending}
      onClick={() => startTransition(() => deleteLocation(locId, clientId))}
    >
      <Trash2 className="size-4" />
      Standort löschen
    </Button>
  );
}

export function TabStandorte({ client }: { client: ClientData }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="max-w-2xl space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {client.locations.length} {client.locations.length === 1 ? "Standort" : "Standorte"}
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => startTransition(async () => { await createLocation(client.id); })}
        >
          <Plus className="size-4" />
          Standort hinzufügen
        </Button>
      </div>

      {client.locations.map((loc) => (
        <LocationCard key={loc.id} loc={loc} clientId={client.id} />
      ))}
    </div>
  );
}
