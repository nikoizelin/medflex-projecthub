import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "MedFlex ProjektHub <noreply@medflex-schweiz.ch>";

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
