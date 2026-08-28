"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { markNotificationRead, markAllNotificationsRead } from "@/app/notifications/actions";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
}

const TYPE_COLOR: Record<string, string> = {
  TICKET_ASSIGNED: "bg-blue-500",
  TICKET_COMMENT: "bg-violet-500",
  PROJECT_COMMENT: "bg-emerald-500",
  SUPPORT_ASSIGNED: "bg-amber-500",
};

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: Notification[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick(n: Notification) {
    if (!n.read) {
      startTransition(() => markNotificationRead(n.id));
    }
    setOpen(false);
    if (n.href) router.push(n.href);
  }

  function handleMarkAll() {
    startTransition(() => markAllNotificationsRead());
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button variant="ghost" size="icon" className="relative size-9" aria-label="Benachrichtigungen" />
      }>
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <span className="text-sm font-semibold">Benachrichtigungen</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={isPending}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <Check className="size-3" />
              Alle gelesen
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Keine Benachrichtigungen</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${!n.read ? "bg-muted/30" : ""}`}
              >
                <span
                  className={`mt-1 size-2 shrink-0 rounded-full ${TYPE_COLOR[n.type] ?? "bg-muted-foreground"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-tight ${!n.read ? "font-semibold" : "font-medium"}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.body}</p>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground/70">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: de })}
                  </p>
                </div>
                {!n.read && (
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-500" />
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
