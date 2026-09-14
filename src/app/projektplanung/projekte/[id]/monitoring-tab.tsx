"use client";

import { Bell, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export interface MonitoringAlert {
  id: string;
  sentAt: string;
}

interface Props {
  projectId: string;
  projectName: string;
  alerts: MonitoringAlert[];
}

export function MonitoringTab({ projectName, alerts }: Props) {
  const sorted = [...alerts].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );

  return (
    <div className="flex flex-col gap-3.5">
      <div className="rounded-lg border bg-background p-3.5">
        <div className="mb-1 flex items-center gap-2">
          <Bell className="size-4 text-muted-foreground" />
          <p className="text-sm font-medium">Monitoring-Erinnerungen</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Für Projekte in der Monitoring- oder Abgeschlossen-Phase wird alle 3 Wochen eine
          Erinnerung an den Projektverantwortlichen gesendet.
        </p>
      </div>

      <div className="rounded-lg border bg-background p-3.5">
        <p className="mb-3 text-sm font-medium">Verlauf</p>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Erinnerungen für {projectName}.</p>
        ) : (
          <ol className="relative border-l border-border">
            {sorted.map((alert) => {
              const date = new Date(alert.sentAt);
              return (
                <li key={alert.id} className="mb-4 ml-4 last:mb-0">
                  <div className="absolute -left-1.5 mt-0.5 size-3 rounded-full border border-background bg-blue-500" />
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                    <time className="text-xs text-muted-foreground">
                      {date.toLocaleDateString("de-CH", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}{" "}
                      &middot;{" "}
                      {formatDistanceToNow(date, { addSuffix: true, locale: de })}
                    </time>
                  </div>
                  <p className="mt-0.5 text-sm">Erinnerung gesendet</p>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
