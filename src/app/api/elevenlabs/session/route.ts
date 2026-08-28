import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { agentId } = await req.json();
  if (!agentId) return NextResponse.json({ error: "agentId required" }, { status: 400 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 500 });

  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/token`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agent_id: agentId }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("ElevenLabs session error:", text);
    return NextResponse.json({ error: "Failed to get session token" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({ token: data.signed_url ?? data.token });
}
