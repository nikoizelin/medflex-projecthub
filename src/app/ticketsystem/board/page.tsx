import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { TicketBoard } from "./ticket-board";

export default async function TicketBoardPage() {
  const [tickets, users, currentUser] = await Promise.all([
    prisma.ticket.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        createdAt: true,
        creator: { select: { name: true } },
        assigneeId: true,
        assignee: { select: { name: true } },
        ticketComments: {
          select: {
            id: true,
            message: true,
            createdAt: true,
            authorId: true,
            author: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    getCurrentUser(),
  ]);

  const data = tickets.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    creatorName: t.creator.name,
    assigneeId: t.assigneeId,
    assigneeName: t.assignee?.name ?? null,
    createdAt: t.createdAt.toISOString(),
    comments: t.ticketComments.map((c) => ({
      id: c.id,
      message: c.message,
      createdAt: c.createdAt.toISOString(),
      authorId: c.authorId,
      authorName: c.author.name,
    })),
  }));

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Ticketboard</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Tickets erfassen und den Status per Klick verwalten.
      </p>
      <TicketBoard
        tickets={data}
        users={users}
        currentUserId={currentUser?.id ?? ""}
        currentUserName={currentUser?.name ?? "Unbekannt"}
      />
    </div>
  );
}
