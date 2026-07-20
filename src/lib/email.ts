import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "MedFlex ProjektHub <no-reply@medflex-schweiz.ch>";

export async function sendTicketAssignmentEmail({
  to,
  assigneeName,
  creatorName,
  ticketTitle,
  ticketDescription,
  ticketPriority,
  ticketStatus,
  isUpdate,
}: {
  to: string;
  assigneeName: string;
  creatorName: string;
  ticketTitle: string;
  ticketDescription: string;
  ticketPriority: string;
  ticketStatus: string;
  isUpdate: boolean;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const priorityLabel: Record<string, string> = { HOCH: "Hoch", MITTEL: "Mittel", NIEDRIG: "Niedrig" };
  const statusLabel: Record<string, string> = { NEU: "Neu", IN_PROGRESS: "In Progress", DONE: "Done" };

  const subject = isUpdate
    ? `Ticket aktualisiert: ${ticketTitle}`
    : `Neues Ticket zugewiesen: ${ticketTitle}`;

  const actionText = isUpdate
    ? `Ein Ticket wurde dir zugewiesen bzw. aktualisiert.`
    : `Dir wurde ein neues Ticket zugewiesen.`;

  const html = `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="background:#064b91;padding:24px 32px;">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">MedFlex ProjektHub</p>
            <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;">Ticketsystem</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:15px;color:#09090b;">Hallo ${assigneeName},</p>
            <p style="margin:0 0 24px;font-size:14px;color:#52525b;">${actionText}</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:8px;padding:20px;margin-bottom:24px;">
              <tr>
                <td style="padding-bottom:12px;">
                  <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a;">Titel</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#09090b;">${ticketTitle}</p>
                </td>
              </tr>
              ${ticketDescription ? `<tr><td style="padding-bottom:12px;"><p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a;">Beschreibung</p><p style="margin:4px 0 0;font-size:14px;color:#3f3f46;white-space:pre-wrap;">${ticketDescription}</p></td></tr>` : ""}
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="50%" style="padding-top:4px;">
                        <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a;">Priorität</p>
                        <p style="margin:4px 0 0;font-size:13px;font-weight:500;color:#09090b;">${priorityLabel[ticketPriority] ?? ticketPriority}</p>
                      </td>
                      <td width="50%" style="padding-top:4px;">
                        <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a;">Status</p>
                        <p style="margin:4px 0 0;font-size:13px;font-weight:500;color:#09090b;">${statusLabel[ticketStatus] ?? ticketStatus}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#71717a;">Zugewiesen von: <span style="color:#09090b;font-weight:500;">${creatorName}</span></p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #f4f4f5;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;">Diese E-Mail wurde automatisch vom MedFlex ProjektHub versendet.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({ from: FROM, to, subject, html });
}

const KATEGORIE_LABEL: Record<string, string> = {
  telefonassistent: "Telefonassistent",
  "medflex-app": "MedFlex App",
  sonstiges: "Sonstiges",
  featurewunsch: "Featurewunsch",
};

export async function sendSupportAssignmentEmail({
  to,
  assigneeName,
  kontaktperson,
  praxisKunde,
  kategorie,
  beschreibungProblem,
  prioritaet,
  datum,
}: {
  to: string;
  assigneeName: string;
  kontaktperson: string;
  praxisKunde: string;
  kategorie: string;
  beschreibungProblem: string;
  prioritaet: string;
  datum: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const subject = `Neue Zuweisung: Anfrage von ${praxisKunde}`;
  const datumFormatted = new Date(datum + "T00:00:00").toLocaleDateString("de-CH", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  const html = `
<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="background:#064b91;padding:24px 32px;">
          <p style="margin:0;color:#fff;font-size:18px;font-weight:600;">MedFlex ProjektHub</p>
          <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;">Support – Kundenzuweisung</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:15px;color:#09090b;">Hallo ${assigneeName},</p>
          <p style="margin:0 0 24px;font-size:14px;color:#52525b;">Dir wurde eine Kunden-Anfrage zugewiesen.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:8px;padding:20px;margin-bottom:24px;">
            <tr><td style="padding-bottom:10px;">
              <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;color:#71717a;">Praxis / Kunde</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#09090b;">${praxisKunde}</p>
            </td></tr>
            <tr><td style="padding-bottom:10px;">
              <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;color:#71717a;">Kontaktperson</p>
              <p style="margin:4px 0 0;font-size:14px;color:#3f3f46;">${kontaktperson}</p>
            </td></tr>
            <tr><td style="padding-bottom:10px;">
              <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;color:#71717a;">Kategorie</p>
              <p style="margin:4px 0 0;font-size:14px;color:#3f3f46;">${KATEGORIE_LABEL[kategorie] ?? kategorie}</p>
            </td></tr>
            <tr><td style="padding-bottom:10px;">
              <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;color:#71717a;">Datum</p>
              <p style="margin:4px 0 0;font-size:14px;color:#3f3f46;">${datumFormatted}</p>
            </td></tr>
            <tr><td>
              <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;color:#71717a;">Beschreibung</p>
              <p style="margin:4px 0 0;font-size:14px;color:#3f3f46;white-space:pre-wrap;">${beschreibungProblem}</p>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#71717a;">Priorität: <span style="color:#09090b;font-weight:500;">${prioritaet.charAt(0).toUpperCase() + prioritaet.slice(1)}</span></p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #f4f4f5;">
          <p style="margin:0;font-size:12px;color:#a1a1aa;">Diese E-Mail wurde automatisch vom MedFlex ProjektHub versendet.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await resend.emails.send({ from: FROM, to, subject, html });
}

export async function sendSupportConfirmationEmail({
  to,
  contactName,
  praxisKunde,
  entries,
}: {
  to: string;
  contactName: string;
  praxisKunde: string;
  entries: { kategorie: string; beschreibungProblem: string; datum: string }[];
}) {
  if (!process.env.RESEND_API_KEY) return;

  const subject = `Ihre Änderungsanfragen wurden übermittelt – ${praxisKunde}`;

  const entryRows = entries.map((e, i) => {
    const datumFormatted = new Date(e.datum + "T00:00:00").toLocaleDateString("de-CH", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
    return `
    <tr><td style="padding:12px 0;border-top:1px solid #e4e4e7;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#09090b;">${i + 1}. ${KATEGORIE_LABEL[e.kategorie] ?? e.kategorie} · ${datumFormatted}</p>
      <p style="margin:6px 0 0;font-size:13px;color:#52525b;white-space:pre-wrap;">${e.beschreibungProblem}</p>
    </td></tr>`;
  }).join("");

  const html = `
<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="background:#064b91;padding:24px 32px;">
          <p style="margin:0;color:#fff;font-size:18px;font-weight:600;">MedFlex Schweiz AG</p>
          <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;">Bestätigung Änderungsanfrage</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:15px;color:#09090b;">Guten Tag ${contactName},</p>
          <p style="margin:0 0 24px;font-size:14px;color:#52525b;">Vielen Dank für Ihre Anfrage. Wir haben die folgenden Einträge erhalten und werden uns in Kürze bei Ihnen melden.</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${entryRows}
          </table>
          <p style="margin:24px 0 0;font-size:14px;color:#52525b;">Mit freundlichen Grüssen,<br>MedFlex Schweiz AG</p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #f4f4f5;">
          <p style="margin:0;font-size:12px;color:#a1a1aa;">Diese E-Mail wurde automatisch versendet. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await resend.emails.send({ from: FROM, to, subject, html });
}
