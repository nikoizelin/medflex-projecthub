import { prisma } from "@/lib/prisma";
import { AnfragenTable } from "./anfragen-table";

export default async function AnfragenPage() {
  const anfragen = await prisma.changeRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  const data = anfragen.map((a) => ({
    id: a.id,
    kontaktperson: a.kontaktperson,
    praxisKunde: a.praxisKunde,
    datum: a.datum.toISOString().slice(0, 10),
    prioritaet: a.prioritaet,
    beschreibungProblem: a.beschreibungProblem,
    linkAnfrage: a.linkAnfrage,
    fehlerhaftesVerhalten: a.fehlerhaftesVerhalten,
    erwartesVerhalten: a.erwartesVerhalten,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Änderungsanfragen</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Eingegangene Kundenanfragen zu Voice Agents.
      </p>
      <AnfragenTable anfragen={data} />
    </div>
  );
}
