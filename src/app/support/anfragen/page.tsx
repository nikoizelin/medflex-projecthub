import { prisma } from "@/lib/prisma";
import { AnfragenTable } from "./anfragen-table";

export default async function AnfragenPage() {
  const [supportRequests, users] = await Promise.all([
    prisma.supportRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        entries: {
          orderBy: { createdAt: "asc" },
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            screenshots: { select: { id: true, filename: true, mimeType: true, data: true } },
          },
        },
      },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const data = supportRequests.map((sr) => ({
    id: sr.id,
    kontaktperson: sr.kontaktperson,
    praxisKunde: sr.praxisKunde,
    email: sr.email,
    createdAt: sr.createdAt.toISOString(),
    entries: sr.entries.map((e) => ({
      id: e.id,
      supportRequestId: e.supportRequestId,
      datum: e.datum.toISOString().slice(0, 10),
      kategorie: e.kategorie,
      prioritaet: e.prioritaet,
      beschreibungProblem: e.beschreibungProblem,
      linkAnfrage: e.linkAnfrage,
      fehlerhaftesVerhalten: e.fehlerhaftesVerhalten,
      erwartesVerhalten: e.erwartesVerhalten,
      status: e.status,
      assigneeId: e.assigneeId,
      assigneeName: e.assignee?.name ?? null,
      kommentar: e.kommentar,
      screenshots: e.screenshots.map((s) => ({
        id: s.id,
        filename: s.filename,
        mimeType: s.mimeType,
        data: s.data,
      })),
      createdAt: e.createdAt.toISOString(),
    })),
  }));

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Änderungsanfragen</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Eingegangene Kundenanfragen – als Parent/Sub-Ticket Struktur.
      </p>
      <AnfragenTable supportRequests={data} users={users} />
    </div>
  );
}
