import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const { agentId } = body ? JSON.parse(body) : {};
    if (!agentId) return NextResponse.json({ error: "agentId required" }, { status: 400 });

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 500 });

    const baseUrl = process.env.ELEVENLABS_BASE_URL ?? "https://api.eu.residency.elevenlabs.io";
    const url = `${baseUrl}/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "xi-api-key": apiKey },
    });

    const responseText = await res.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: `ElevenLabs HTTP ${res.status}: ${responseText.slice(0, 300)}` },
        { status: 502 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `ElevenLabs ${res.status}: ${JSON.stringify(data)}` },
        { status: 502 }
      );
    }

    const token = (data.signed_url ?? data.token) as string | undefined;
    if (!token) {
      return NextResponse.json(
        { error: `No signed_url/token in response: ${JSON.stringify(data)}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ token });
  } catch (err) {
    console.error("[elevenlabs] unhandled error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
