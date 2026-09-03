"use client";

import { useState, useTransition } from "react";
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
          11Labs → Conversational AI → Agents → Agent auswählen → Agent ID kopieren
        </p>
      </div>

      <Button onClick={save} disabled={pending}>
        {pending ? "Speichert…" : saved ? "Gespeichert ✓" : "Speichern"}
      </Button>
    </div>
  );
}
