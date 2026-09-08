import { NextRequest, NextResponse } from "next/server";
import WebSocket from "ws";

type Message = { role: "user" | "agent"; text: string };
type ScenarioResult = { scenario: string; transcript: Message[]; error?: string; debug: string[] };

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API-Key nicht konfiguriert" }, { status: 500 });
  }

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
  return new Promise((resolve) => {
    const transcript: Message[] = [];
    const debug: string[] = [];
    let settled = false;

    const log = (msg: string) => debug.push(`[${new Date().toISOString().slice(11, 23)}] ${msg}`);

    const finish = (error?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { ws.terminate(); } catch { /* ignore */ }
      resolve({ scenario: scenarioText, transcript, error, debug });
    };

    const timer = setTimeout(() => finish("Timeout (30s)"), 30_000);

    const url = `wss://api.eu.residency.elevenlabs.io/v1/convai/conversation?agent_id=${encodeURIComponent(agentId)}`;
    log(`Verbinde: ${url}`);

    const ws = new WebSocket(url, { headers: { "xi-api-key": apiKey } });

    let userSent = false;

    ws.on("open", () => {
      log("WebSocket geöffnet");
    });

    ws.on("message", (raw) => {
      const str = raw.toString();
      log(`Nachricht empfangen: ${str.slice(0, 300)}`);
      try {
        const msg = JSON.parse(str);

        if (msg.type === "conversation_initiation_metadata" && !userSent) {
          userSent = true;
          log(`Sende user_message: "${scenarioText}"`);
          transcript.push({ role: "user", text: scenarioText });
          ws.send(JSON.stringify({ type: "user_message", user_message: scenarioText }));
        }

        if (msg.type === "agent_response") {
          const text =
            msg.agent_response_event?.agent_response ??
            msg.agent_response ??
            "";
          log(`agent_response text: "${text}"`);
          if (text) {
            transcript.push({ role: "agent", text });
            setTimeout(() => finish(), 800);
          }
        }
      } catch (e) {
        log(`Parse-Fehler: ${e}`);
      }
    });

    ws.on("close", (code, reason) => {
      log(`WebSocket geschlossen: code=${code} reason=${reason.toString() || "(leer)"}`);
      finish();
    });
    ws.on("error", (err) => {
      log(`WebSocket Fehler: ${err.message}`);
      finish(err.message);
    });
  });
}
