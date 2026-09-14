import { NextRequest, NextResponse } from "next/server";
import WebSocket from "ws";
import Anthropic from "@anthropic-ai/sdk";

type Message = { role: "user" | "agent"; text: string };
type ConvHistory = { role: "user" | "assistant"; content: string };
type ScenarioResult = {
  scenario: string;
  transcript: Message[];
  persona: string;
  error?: string;
  debug: string[];
};

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Persona ────────────────────────────────────────────────────────────────

interface Persona {
  name: string;
  phone: string;
  birthDate: string;
  insurance: string;
  street: string;
  city: string;
  description: string;
}

async function generatePersona(scenarioText: string): Promise<Persona> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `Generiere eine realistische Schweizer Persona für folgendes Anruf-Szenario: "${scenarioText}"

Antworte NUR mit einem JSON-Objekt ohne Markdown-Codeblock:
{
  "name": "Vorname Nachname",
  "phone": "+41 79 xxx xx xx",
  "birthDate": "DD.MM.YYYY",
  "insurance": "Krankenkassenname",
  "street": "Strassenname Nr",
  "city": "PLZ Ort",
  "description": "Kurze Charakterbeschreibung 1-2 Sätze, warum er/sie anruft"
}`,
      },
    ],
  });

  try {
    const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      name: "Maria Müller",
      phone: "+41 79 123 45 67",
      birthDate: "15.03.1978",
      insurance: "Helsana",
      street: "Bahnhofstrasse 12",
      city: "8001 Zürich",
      description: scenarioText,
    };
  }
}

// ── Claude as caller ───────────────────────────────────────────────────────

function personaSystemPrompt(p: Persona, scenario: string): string {
  return `Du bist ${p.name}, geboren am ${p.birthDate}.
Telefon: ${p.phone}
Adresse: ${p.street}, ${p.city}
Krankenkasse: ${p.insurance}
${p.description}

Du rufst gerade bei einer Arztpraxis an. Dein Anliegen: "${scenario}"

Regeln:
- Antworte NUR mit deiner nächsten gesprochenen Aussage (Deutsch, natürlich, kurz).
- Gib KEINE Regieanweisungen oder Erklärungen.
- Beantworte Fragen der Praxis mit deinen obigen Personendaten.
- Wenn das Gespräch abgeschlossen ist (gegenseitige Verabschiedung), antworte exakt mit: <<ENDE>>`;
}

async function getPersonaReply(
  persona: Persona,
  scenario: string,
  history: ConvHistory[],
  agentText: string
): Promise<string> {
  const messages: ConvHistory[] = [...history, { role: "user", content: agentText }];

  const resp = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    system: personaSystemPrompt(persona, scenario),
    messages,
  });

  return resp.content[0].type === "text" ? resp.content[0].text.trim() : "<<ENDE>>";
}

async function getPersonaToolResult(
  persona: Persona,
  toolName: string,
  parameters: Record<string, unknown>
): Promise<string> {
  const resp = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: `Du bist ${persona.name}, geb. ${persona.birthDate}, Tel: ${persona.phone}, Adresse: ${persona.street} ${persona.city}, Krankenkasse: ${persona.insurance}.
Antworte mit einem JSON-String als Tool-Ergebnis. Nutze deine Personendaten wo passend.`,
    messages: [
      {
        role: "user",
        content: `Tool "${toolName}" wurde aufgerufen mit Parametern: ${JSON.stringify(parameters, null, 2)}.
Gib das Ergebnis als JSON zurück.`,
      },
    ],
  });

  return resp.content[0].type === "text" ? resp.content[0].text.trim() : "{}";
}

// ── Main scenario runner ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ELEVENLABS_API_KEY nicht konfiguriert" }, { status: 500 });
  if (!process.env.ANTHROPIC_API_KEY)
    return NextResponse.json({ error: "ANTHROPIC_API_KEY nicht konfiguriert" }, { status: 500 });

  const body = await req.json();
  const agentId: string = (body.agentId ?? "").trim();
  const scenarios: { text: string }[] = body.scenarios ?? [];

  if (!agentId) return NextResponse.json({ error: "Agent ID fehlt" }, { status: 400 });
  if (!scenarios.length) return NextResponse.json({ error: "Keine Szenarien angegeben" }, { status: 400 });

  const results: ScenarioResult[] = [];
  for (const s of scenarios) {
    results.push(await runScenario(agentId, apiKey, s.text));
  }

  return NextResponse.json({ results });
}

function runScenario(agentId: string, apiKey: string, scenarioText: string): Promise<ScenarioResult> {
  return new Promise(async (resolve) => {
    const transcript: Message[] = [];
    const convHistory: ConvHistory[] = [];
    const debug: string[] = [];
    let settled = false;
    let persona: Persona | null = null;

    const log = (msg: string) => debug.push(`[${new Date().toISOString().slice(11, 23)}] ${msg}`);

    const finish = (error?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { ws.terminate(); } catch { /* ignore */ }
      resolve({
        scenario: scenarioText,
        transcript,
        persona: persona
          ? `${persona.name} · geb. ${persona.birthDate} · ${persona.phone} · ${persona.insurance}`
          : "",
        error,
        debug,
      });
    };

    // 120 s hard timeout per scenario
    const timer = setTimeout(() => finish("Timeout (120s)"), 120_000);

    // Generate persona first
    log("Generiere Persona via Claude…");
    try {
      persona = await generatePersona(scenarioText);
      log(`Persona: ${persona.name}, geb. ${persona.birthDate}, ${persona.phone}`);
    } catch (e) {
      log(`Persona-Generierung fehlgeschlagen: ${e}`);
      finish("Persona-Generierung fehlgeschlagen");
      return;
    }

    const url = `wss://api.eu.residency.elevenlabs.io/v1/convai/conversation?agent_id=${encodeURIComponent(agentId)}`;
    log(`Verbinde: ${url}`);

    const ws = new WebSocket(url, { headers: { "xi-api-key": apiKey } });

    ws.on("open", () => log("WebSocket geöffnet"));

    ws.on("message", async (raw) => {
      if (settled) return;
      const str = raw.toString();
      log(`← ${str.slice(0, 400)}`);

      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(str);
      } catch {
        log("Parse-Fehler");
        return;
      }

      // ── Agent speaks ────────────────────────────────────────────────────
      if (msg.type === "agent_response") {
        const agentText: string =
          (msg.agent_response_event as Record<string, unknown>)?.agent_response as string
          ?? (msg.agent_response as string)
          ?? "";

        if (!agentText) return;

        log(`Agent: "${agentText}"`);
        transcript.push({ role: "agent", text: agentText });

        // Let Claude (as persona) reply
        log("Generiere Persona-Antwort…");
        let reply: string;
        try {
          reply = await getPersonaReply(persona!, scenarioText, convHistory, agentText);
        } catch (e) {
          log(`Claude-Fehler: ${e}`);
          finish("Claude API Fehler");
          return;
        }

        // Update conversation history
        convHistory.push({ role: "user", content: agentText });
        convHistory.push({ role: "assistant", content: reply });

        if (reply === "<<ENDE>>") {
          log("Gespräch beendet (<<ENDE>>)");
          finish();
          return;
        }

        log(`Persona: "${reply}"`);
        transcript.push({ role: "user", text: reply });

        ws.send(JSON.stringify({ type: "user_message", user_message: reply }));
        log(`→ user_message gesendet`);
        return;
      }

      // ── Tool call from agent ────────────────────────────────────────────
      if (msg.type === "client_tool_call") {
        const toolCallId = msg.tool_call_id as string;
        const toolName = msg.tool_name as string;
        const parameters = (msg.parameters ?? {}) as Record<string, unknown>;

        log(`Tool-Call: ${toolName}(${JSON.stringify(parameters)})`);
        transcript.push({
          role: "agent",
          text: `[Tool: ${toolName}(${JSON.stringify(parameters)})]`,
        });

        let result: string;
        try {
          result = await getPersonaToolResult(persona!, toolName, parameters);
        } catch (e) {
          log(`Tool-Antwort-Fehler: ${e}`);
          result = "{}";
        }

        log(`Tool-Ergebnis: ${result}`);
        transcript.push({ role: "user", text: `[Tool-Ergebnis: ${result}]` });

        ws.send(
          JSON.stringify({
            type: "client_tool_result",
            tool_call_id: toolCallId,
            result,
            is_error: false,
          })
        );
        log(`→ client_tool_result gesendet`);
        return;
      }

      // ── Conversation initiation: send first opener ──────────────────────
      if (msg.type === "conversation_initiation_metadata") {
        log("Warte auf ersten Agent-Gruss…");
        // First message comes via agent_response, we react there
        return;
      }

      // ── Conversation ended by server ────────────────────────────────────
      if (msg.type === "conversation_ended" || msg.type === "conversation_end") {
        log("Server signalisiert Gesprächsende");
        finish();
      }
    });

    ws.on("close", (code, reason) => {
      log(`WebSocket geschlossen: ${code} ${reason.toString() || "(leer)"}`);
      finish();
    });

    ws.on("error", (err) => {
      log(`WebSocket Fehler: ${err.message}`);
      finish(err.message);
    });
  });
}
