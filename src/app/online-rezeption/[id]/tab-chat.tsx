"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateChatConfig } from "./actions";
import type { ClientData } from "./client-config";

export function TabChat({ client }: { client: ClientData }) {
  const [agentId, setAgentId] = useState(client.elevenLabsAgentId);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await updateChatConfig(client.id, agentId);
      setSaved(true);
    });
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">11Labs Conversational AI</p>
            <p>
              Das Chat-Tab läuft über einen 11Labs-Agenten. Konfiguriere den Agenten
              im{" "}
              <a
                href="https://elevenlabs.io/app/conversational-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-primary underline-offset-2 hover:underline"
              >
                11Labs Dashboard
                <ExternalLink className="size-3" />
              </a>
              , kopiere die Agent-ID und füge sie hier ein.
            </p>
            <p className="text-xs">
              Den API-Key <strong>ELEVENLABS_API_KEY</strong> hast du bereits in den
              Vercel-Umgebungsvariablen hinterlegt.
            </p>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="agentId">11Labs Agent-ID</Label>
        <Input
          id="agentId"
          value={agentId}
          placeholder="z. B. agent_01jxxxxxxxxxxxxxxxxxx"
          onChange={(e) => { setAgentId(e.target.value); setSaved(false); }}
          className="mt-1 font-mono"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Zu finden unter: 11Labs → Conversational AI → Agents → Agent auswählen → Agent ID
        </p>
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <p className="text-sm font-medium">Prompt-Tipp für den 11Labs-Agenten</p>
        <p className="text-xs text-muted-foreground">
          Damit der Chat-Agent einen Button zum Step-by-Step-Formular anzeigen kann,
          füge folgenden Text in den Agenten-Prompt ein:
        </p>
        <code className="block rounded bg-muted px-3 py-2 text-xs whitespace-pre-wrap">
{`Wenn der Patient einen Termin anfragen möchte, antworte mit:
[OPEN_FORM:termin-anfragen]
Wenn der Patient ein Rezept anfordern möchte, antworte mit:
[OPEN_FORM:rezept-anfordern]`}
        </code>
        <p className="text-xs text-muted-foreground">
          Das Widget erkennt diese Marker und zeigt dem Patienten einen Button
          der direkt ins entsprechende Formular führt.
        </p>
      </div>

      <Button onClick={save} disabled={pending}>
        {pending ? "Speichert…" : saved ? "Gespeichert ✓" : "Speichern"}
      </Button>
    </div>
  );
}
