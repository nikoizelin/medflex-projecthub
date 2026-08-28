"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createLocation, updateLocation, deleteLocation, updateOpeningHours } from "./actions";
import type { ClientData } from "./client-config";

const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

type Location = ClientData["locations"][number];
type Hours = Location["openingHours"][number];

function LocationCard({ loc, clientId }: { loc: Location; clientId: string }) {
  const [expanded, setExpanded] = useState(true);
  const [info, setInfo] = useState({ name: loc.name, address: loc.address, phone: loc.phone });
  const [hours, setHours] = useState<Hours[]>(loc.openingHours);
  const [infoSaved, setInfoSaved] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function saveInfo() {
    startTransition(async () => {
      await updateLocation(loc.id, clientId, info);
      setInfoSaved(true);
    });
  }

  function saveHours() {
    startTransition(async () => {
      await updateOpeningHours(loc.id, clientId, hours);
      setHoursSaved(true);
    });
  }

  function setHour(id: string, key: keyof Hours, value: string | boolean) {
    setHours((h) => h.map((row) => row.id === id ? { ...row, [key]: value } : row));
    setHoursSaved(false);
  }

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/30"
      >
        {info.name || "Standort"}
        {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-5">
          {/* Kontaktdaten */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Name des Standorts</Label>
              <Input value={info.name} onChange={(e) => { setInfo((i) => ({ ...i, name: e.target.value })); setInfoSaved(false); }} className="mt-1" />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={info.phone} placeholder="+41 44 000 00 00" onChange={(e) => { setInfo((i) => ({ ...i, phone: e.target.value })); setInfoSaved(false); }} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Adresse</Label>
              <Input value={info.address} placeholder="Musterstrasse 1, 8001 Zürich" onChange={(e) => { setInfo((i) => ({ ...i, address: e.target.value })); setInfoSaved(false); }} className="mt-1" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button size="sm" variant="outline" onClick={saveInfo} disabled={pending}>
              {infoSaved ? "Gespeichert ✓" : "Kontaktdaten speichern"}
            </Button>
            <DeleteLocationButton locId={loc.id} clientId={clientId} />
          </div>

          {/* Öffnungszeiten */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Öffnungszeiten</h3>
            <div className="space-y-1.5">
              {hours.map((h) => (
                <div key={h.id} className="flex items-center gap-2 text-sm">
                  <span className="w-24 shrink-0 text-muted-foreground">{DAYS[h.dayOfWeek]}</span>
                  <Checkbox
                    checked={h.isClosed}
                    onCheckedChange={(v) => setHour(h.id, "isClosed", Boolean(v))}
                    id={`closed-${h.id}`}
                  />
                  <label htmlFor={`closed-${h.id}`} className="w-16 shrink-0 text-xs text-muted-foreground">
                    {h.isClosed ? "Geschlossen" : "Offen"}
                  </label>
                  {!h.isClosed && (
                    <>
                      <Input
                        type="time"
                        value={h.openTime}
                        onChange={(e) => setHour(h.id, "openTime", e.target.value)}
                        className="h-7 w-28 text-xs"
                      />
                      <span className="text-muted-foreground">–</span>
                      <Input
                        type="time"
                        value={h.closeTime}
                        onChange={(e) => setHour(h.id, "closeTime", e.target.value)}
                        className="h-7 w-28 text-xs"
                      />
                      <Input
                        value={h.note}
                        placeholder="Hinweis (opt.)"
                        onChange={(e) => setHour(h.id, "note", e.target.value)}
                        className="h-7 flex-1 text-xs"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" className="mt-3" onClick={saveHours} disabled={pending}>
              {hoursSaved ? "Gespeichert ✓" : "Öffnungszeiten speichern"}
            </Button>
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
