import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { agentId } = await req.json();
  if (!agentId) return NextResponse.json({ error: "agentId required" }, { status: 400 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 500 });

  const baseUrl = process.env.ELEVENLABS_BASE_URL ?? "https://api.eu.elevenlabs.io";

  const res = await fetch(
    `${baseUrl}/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`,
    {
      method: "GET",
      headers: { "xi-api-key": apiKey },
    }
  );

  const responseText = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(responseText);
  } catch {
    console.error("ElevenLabs non-JSON response:", res.status, responseText);
    return NextResponse.json(
      { error: `ElevenLabs HTTP ${res.status}: ${responseText.slice(0, 200)}` },
      { status: 502 }
    );
  }

  if (!res.ok) {
    console.error("ElevenLabs session error:", res.status, data);
    return NextResponse.json(
      { error: `ElevenLabs ${res.status}: ${JSON.stringify(data)}` },
      { status: 502 }
    );
  }

  const token = (data.signed_url ?? data.token) as string | undefined;
  if (!token) {
    console.error("ElevenLabs missing token in response:", data);
    return NextResponse.json({ error: `No token in response: ${JSON.stringify(data)}` }, { status: 502 });
  }

  return NextResponse.json({ token });
}
