"use client";

import { useState } from "react";
import { Loader2, Play, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "agent"; text: string };
type TestResult = { scenario: string; transcript: Message[]; error?: string };

export function AgentTestSection() {
  const [agentId, setAgentId] = useState("");
  const [scenarios, setScenarios] = useState<string[]>([
    "Patientin will einen Termin buchen",
    "Patient möchte einen Termin stornieren",
    "Arzt ruft in die Praxis an aus der Klinik Hirslanden",
    "Die Patientin ruft an weil sie ein Anruf der Praxis verpasst hat.",
    "Der Patient ruft mit einer Festnetznummer an und möchte die Öffnungszeiten wissen",
  ]);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const addScenario = () => setScenarios((s) => [...s, ""]);
  const removeScenario = (i: number) => setScenarios((s) => s.filter((_, idx) => idx !== i));
  const updateScenario = (i: number, val: string) =>
    setScenarios((s) => s.map((v, idx) => (idx === i ? val : v)));

  const runTests = async () => {
    const valid = scenarios.filter((s) => s.trim());
    if (!agentId.trim() || !valid.length) return;

    setRunning(true);
    setResults(null);
    setGlobalError(null);

    try {
      const res = await fetch("/api/agent-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agentId.trim(),
          scenarios: valid.map((text) => ({ text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unbekannter Fehler");
      setResults(data.results);
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Fehler beim Ausführen");
    } finally {
      setRunning(false);
    }
  };

  const canRun = agentId.trim().length > 0 && scenarios.some((s) => s.trim());

  return (
    <div className="flex flex-col gap-3.5">
      <div className="rounded-lg border bg-background p-3.5">
        <p className="mb-3 text-sm font-medium">Automatisierter Agent-Test</p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-id-input">ElevenLabs Agent ID</Label>
            <Input
              id="agent-id-input"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="z.B. 4d7OLaAjPLkGm3YTwDfc"
              disabled={running}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Testszenarien</Label>
            <div className="flex flex-col gap-2">
              {scenarios.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={s}
                    onChange={(e) => updateScenario(i, e.target.value)}
                    placeholder={`Szenario ${i + 1}: z.B. Patient möchte Termin buchen`}
                    disabled={running}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && i === scenarios.length - 1 && scenarios.length < 5) {
                        addScenario();
                      }
                    }}
                  />
                  {scenarios.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeScenario(i)}
                      disabled={running}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
              {scenarios.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addScenario}
                  disabled={running}
                  className="w-fit gap-1.5"
                >
                  <Plus className="size-3.5" />
                  Szenario hinzufügen
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={runTests} disabled={running || !canRun} className="gap-1.5">
              {running ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Tests laufen…
                </>
              ) : (
                <>
                  <Play className="size-4" />
                  Tests ausführen
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {globalError && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
          {globalError}
        </p>
      )}

      {results?.map((result, i) => (
        <div key={i} className="rounded-lg border bg-background p-3.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Szenario {i + 1}</p>
            {!result.error && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Abgeschlossen</span>
            )}
          </div>
          <p className="mb-3 text-xs text-muted-foreground">{result.scenario}</p>

          <div className="flex flex-col gap-2">
            {result.transcript.map((msg, j) => (
              <div
                key={j}
                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {result.error && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {result.error}
                </div>
              </div>
            )}
            {result.transcript.length === 0 && !result.error && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  Kein Transkript empfangen. Prüfe ob die Agent ID korrekt ist und der Agent Text-Input unterstützt.
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
