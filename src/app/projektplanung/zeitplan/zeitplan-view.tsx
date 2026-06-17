"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { stripTime } from "@/lib/schedule";

const fmt = new Intl.DateTimeFormat("de-CH", { day: "2-digit", month: "2-digit" });
const fmtLong = new Intl.DateTimeFormat("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });

interface Step {
  name: string;
  start: string;
  end: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
  steps: Step[];
}

export function ZeitplanView({ projects }: { projects: Project[] }) {
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? "");

  if (projects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Noch keine berechneten Projekte. Berechne ein Projekt in der
        Projektdetailseite, um den Zeitplan zu sehen.
      </p>
    );
  }

  const project = projects.find((p) => p.id === selectedId) ?? projects[0];
  const totalStart = new Date(project.steps[0].start).getTime();
  const totalEnd = project.steps.reduce(
    (latest, s) => Math.max(latest, new Date(s.end).getTime()),
    new Date(project.steps[0].end).getTime()
  );
  const totalDays = Math.max(1, (totalEnd - totalStart) / 86400000);

  const today = stripTime(new Date()).getTime();
  const todayPct = (today - totalStart) / 86400000 / totalDays;
  const showToday = todayPct >= 0 && todayPct <= 1;

  const TIMELINE_COLS = "minmax(0,2fr)_minmax(0,5fr)_90px";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={project.id} onValueChange={(v) => v && setSelectedId(v)}>
          <SelectTrigger className="w-55">
            <SelectValue>{project.name}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="flex items-center gap-1.5 text-sm font-medium">
          <span className="size-2.5 rounded-full" style={{ background: project.color }} />
          {project.name}
        </p>

        <p className="text-xs text-muted-foreground">
          {fmtLong.format(new Date(totalStart))} – {fmtLong.format(new Date(totalEnd))}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div
          className="grid items-center gap-3 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground"
          style={{ gridTemplateColumns: TIMELINE_COLS.replace(/_/g, " ") }}
        >
          <span>Schritt</span>
          <div className="flex justify-between">
            <span>{fmt.format(new Date(totalStart))}</span>
            <span>{fmt.format(new Date((totalStart + totalEnd) / 2))}</span>
            <span>{fmt.format(new Date(totalEnd))}</span>
          </div>
          <span className="text-right">Zeitraum</span>
        </div>

        <div className="relative divide-y">
          {showToday && (
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-blue-500"
              style={{
                left: `calc(0.75rem + (100% - 90px - 1.5rem) * ${(2 + todayPct * 5) / 7})`,
              }}
            />
          )}
          {project.steps.map((s, idx) => {
            const start = new Date(s.start).getTime();
            const end = new Date(s.end).getTime();
            const left = ((start - totalStart) / 86400000 / totalDays) * 100;
            const width = Math.max(((end - start) / 86400000 / totalDays) * 100, 1.5);
            const days = Math.round((end - start) / 86400000) + 1;

            return (
              <div
                key={s.name}
                className="grid items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-muted/30"
                style={{ gridTemplateColumns: TIMELINE_COLS.replace(/_/g, " ") }}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                    {idx + 1}
                  </span>
                  <span className="truncate">{s.name}</span>
                </div>
                <div className="relative h-2.5 rounded-full bg-muted">
                  <div
                    className="absolute h-full rounded-full"
                    style={{ left: `${left}%`, width: `${width}%`, background: project.color }}
                  />
                </div>
                <span className="text-right text-xs text-muted-foreground">
                  {fmt.format(new Date(s.start))} – {fmt.format(new Date(s.end))}
                  <span className="ml-1.5 text-muted-foreground/60">({days}T)</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
