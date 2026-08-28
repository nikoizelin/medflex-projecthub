import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEBUG_EMAIL = "nico.iselin@medflex-schweiz.ch";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const client = await prisma.receptionClient.findUnique({
    where: { slug },
    select: { name: true },
  });
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  let answers: Record<string, string> = {};
  let contact: Record<string, string> = {};
  let location: Record<string, string> | null = null;
  let type = "form";

  const ct = req.headers.get("content-type") ?? "";

  if (ct.includes("application/json")) {
    const body = await req.json();
    type = body.type ?? "form";
    contact = body.contact ?? {};
    location = body.location ?? null;
  } else {
    const fd = await req.formData();
    type = String(fd.get("type") ?? "form");
    const answersRaw = fd.get("answers");
    const contactRaw = fd.get("contact");
    const locationRaw = fd.get("location");
    if (answersRaw) answers = JSON.parse(String(answersRaw));
    if (contactRaw) contact = JSON.parse(String(contactRaw));
    if (locationRaw) location = JSON.parse(String(locationRaw));
  }

  const patientEmail = contact.email as string | undefined;
  const patientName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");

  // Format plain-text email body
  const lines: string[] = [
    `=== ${type === "chat" ? "Chat-Zusammenfassung" : "Formular-Einsendung"} ===`,
    `Praxis: ${client.name}`,
    "",
    "── Kontaktdaten ──",
    `Name: ${patientName}`,
    `Geburtsdatum: ${contact.birthdate ?? "–"}`,
    `Telefon: ${contact.countryCode ?? ""}${contact.phone ?? "–"}`,
    `E-Mail: ${contact.email ?? "–"}`,
    contact.forSelf === "proxy"
      ? `Vertretung für: ${contact.proxyName ?? "–"} (geb. ${contact.proxyBirthdate ?? "–"})`
      : "",
    location ? `Standort: ${(location as Record<string, string>).name ?? "–"}` : "",
  ].filter((l) => l !== "");

  if (Object.keys(answers).length > 0) {
    lines.push("", "── Formularantworten ──");
    for (const [key, val] of Object.entries(answers)) {
      lines.push(`${key}: ${val}`);
    }
  }

  const body = lines.join("\n");

  const { Resend } = await import("resend");
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  // 1. Debug-Mail an MedFlex
  await resend?.emails.send({
    from: "MedFlex Rezeption <no-reply@medflex-schweiz.ch>",
    to: DEBUG_EMAIL,
    subject: `[DEBUG] Neue Anfrage – ${client.name}`,
    text: body,
  });

  // 2. Bestätigung an Patienten
  if (patientEmail) {
    await resend?.emails.send({
      from: "MedFlex Rezeption <no-reply@medflex-schweiz.ch>",
      to: patientEmail,
      subject: `Ihre Anfrage an ${client.name} ist eingegangen`,
      text: [
        `Guten Tag${patientName ? " " + patientName : ""},`,
        "",
        `Ihre Anfrage an ${client.name} ist eingegangen. Wir melden uns in Kürze bei Ihnen.`,
        "",
        "Mit freundlichen Grüssen",
        client.name,
        "",
        "────────────────────────────",
        "Diese E-Mail wurde automatisch generiert über die MedFlex Online Rezeption.",
        "https://medflex-schweiz.ch",
      ].join("\n"),
    });
  }

  return NextResponse.json({ ok: true });
}
