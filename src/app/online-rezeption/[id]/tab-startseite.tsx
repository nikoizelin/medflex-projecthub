"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateStartseite, createNews, updateNews, deleteNews } from "./actions";
import type { ClientData } from "./client-config";

type NewsItem = ClientData["news"][number];

function NewsCard({ item, clientId }: { item: NewsItem; clientId: string }) {
  const [data, setData] = useState({ title: item.title, body: item.body });
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await updateNews(item.id, clientId, data);
      setSaved(true);
    });
  }

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <Input
        value={data.title}
        placeholder="Titel der Meldung"
        onChange={(e) => { setData((d) => ({ ...d, title: e.target.value })); setSaved(false); }}
      />
      <Textarea
        value={data.body}
        placeholder="Inhalt der Meldung …"
        rows={2}
        onChange={(e) => { setData((d) => ({ ...d, body: e.target.value })); setSaved(false); }}
      />
      <div className="flex items-center justify-between">
        <Button size="sm" variant="outline" onClick={save} disabled={pending}>
          {saved ? "Gespeichert ✓" : "Speichern"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={pending}
          onClick={() => startTransition(() => deleteNews(item.id, clientId))}
        >
          <Trash2 className="size-4" />
          Löschen
        </Button>
      </div>
    </div>
  );
}

export function TabStartseite({ client }: { client: ClientData }) {
  const [form, setForm] = useState({
    fachrichtung: client.fachrichtung,
    introText: client.introText,
  });
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await updateStartseite(client.id, form);
      setSaved(true);
    });
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Allgemeine Infos */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">Praxis-Informationen</h2>
        <div className="space-y-3">
          <div>
            <Label htmlFor="fachrichtung">Fachrichtung</Label>
            <Input
              id="fachrichtung"
              value={form.fachrichtung}
              placeholder="z. B. Allgemeinmedizin, Pädiatrie …"
              onChange={(e) => { setForm((f) => ({ ...f, fachrichtung: e.target.value })); setSaved(false); }}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="introText">Beschreibungstext</Label>
            <Textarea
              id="introText"
              value={form.introText}
              placeholder="Herzlich willkommen in unserer Praxis …"
              rows={4}
              onChange={(e) => { setForm((f) => ({ ...f, introText: e.target.value })); setSaved(false); }}
              className="mt-1"
            />
          </div>
        </div>
        <Button className="mt-3" onClick={save} disabled={pending}>
          {pending ? "Speichert…" : saved ? "Gespeichert ✓" : "Speichern"}
        </Button>
      </section>

      {/* News */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Meldungen / News
            <span className="ml-2 text-xs font-normal text-muted-foreground">({client.news.length})</span>
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => startTransition(() => createNews(client.id))}
            disabled={pending}
          >
            <Plus className="size-4" />
            Meldung hinzufügen
          </Button>
        </div>
        {client.news.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Meldungen.</p>
        ) : (
          <div className="space-y-2">
            {client.news.map((n) => (
              <NewsCard key={n.id} item={n} clientId={client.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
