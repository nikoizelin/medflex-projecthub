import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notification-bell";
import { prisma } from "@/lib/prisma";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function AppTopbar({
  title,
  userName,
  userId,
}: {
  title: string;
  userName: string;
  userId: string;
}) {
  const notifications = userId
    ? await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, type: true, title: true, body: true, href: true, read: true, createdAt: true },
      })
    : [];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="flex items-center gap-3 border-b px-4 py-2.5">
      <p className="flex-1 text-sm font-medium">{title}</p>
      <ThemeToggle />
      <NotificationBell
        notifications={notifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))}
        unreadCount={unreadCount}
      />
      <Link href="/konto">
        <Avatar className="size-7 transition-opacity hover:opacity-80">
          <AvatarFallback className="text-xs font-medium">
            {initials(userName)}
          </AvatarFallback>
        </Avatar>
      </Link>
    </header>
  );
}
