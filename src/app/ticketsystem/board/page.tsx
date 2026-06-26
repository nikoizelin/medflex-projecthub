import { prisma } from "@/lib/prisma";
import { TicketBoard } from "./ticket-board";

export default async function TicketBoardPage() {
  const [tickets, users] = await Promise.all([
    prisma.ticket.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        creator: { select: { name: true } },
        assigneeId: true,
        assignee: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const data = tickets.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    creatorName: t.creator.name,
    assigneeId: t.assigneeId,
    assigneeName: t.assignee?.name ?? null,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Ticketboard</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Tickets erfassen und den Status per Klick verwalten.
      </p>
      <TicketBoard tickets={data} users={users} />
    </div>
  );
}
