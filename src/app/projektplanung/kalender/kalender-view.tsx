"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { isWeekend, stripTime, isSameDay } from "@/lib/schedule";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr"];
const MAX_VISIBLE = 2;

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

interface CalEntry {
  projectName: string;
  projectColor: string;
  stepName: string;
}

export function KalenderView({ projects }: { projects: Project[] }) {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [filter, setFilter] = useState("all");

  const selectedProjects =
    filter === "all" ? projects : projects.filter((p) => p.id === filter);
  const filterLabel =
    filter === "all" ? "Alle Projekte" : projects.find((p) => p.id === filter)?.name ?? "Alle Projekte";

  const cells = useMemo(() => {
    const firstDay = new Date(currentMonth);
    let firstWeekday = firstDay.getDay();
    firstWeekday = firstWeekday === 0 ? 7 : firstWeekday;
    const cursor = new Date(firstDay);
    cursor.setDate(cursor.getDate() - (firstWeekday - 1));

    const result: { date: Date; entries: CalEntry[] }[] = [];
    while (result.length < 30) {
      if (!isWeekend(cursor)) {
        const cellDate = new Date(cursor);
        const entries: CalEntry[] = [];
        selectedProjects.forEach((p) => {
          p.steps.forEach((s) => {
            const start = stripTime(new Date(s.start));
            const end = stripTime(new Date(s.end));
            if (cellDate >= start && cellDate <= end) {
              entries.push({ projectName: p.name, projectColor: p.color, stepName: s.name });
            }
          });
        });
        result.push({ date: cellDate, entries });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [currentMonth, selectedProjects]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto pb-3.5">
      <div className="mb-3 flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-32 text-center text-sm font-medium">
          {currentMonth.toLocaleDateString("de-CH", { month: "long", year: "numeric" })}
        </span>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="outline" onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>
          Heute
        </Button>
      </div>

      <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
        <SelectTrigger className="mb-3 w-46">
          <SelectValue>{filterLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Projekte</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="mb-1.5 grid grid-cols-5 gap-1.5">
        {WEEKDAYS.map((d) => (
          <div key={d} className="min-w-0 px-1 py-1 text-center text-sm font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 auto-rows-[8.5rem] gap-1.5">
        {cells.map(({ date, entries }, i) => {
          const isToday = isSameDay(date, today);
          const isOtherMonth = date.getMonth() !== currentMonth.getMonth();
          const visible = entries.slice(0, MAX_VISIBLE);
          const rest = entries.slice(MAX_VISIBLE);

          return (
            <div
              key={i}
              className={cn(
                "relative z-0 flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-lg border bg-card p-2 has-[.group:hover]:z-30 has-[.group:hover]:overflow-visible",
                isToday && "ring-1 ring-blue-500/40",
                isOtherMonth && "opacity-40"
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-foreground",
                  isToday && "bg-blue-500 text-white"
                )}
              >
                {date.getDate()}
              </span>
              <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
                {visible.map((e, j) => (
                  <div
                    key={j}
                    title={`${e.projectName}: ${e.stepName}`}
                    className="flex flex-col gap-0 overflow-hidden rounded-md border-l-[3px] py-0.5 pr-1.5 pl-1.5 leading-tight"
                    style={{
                      borderLeftColor: e.projectColor,
                      backgroundColor: `${e.projectColor}1a`,
                    }}
                  >
                    <span className="truncate text-[11px] font-medium text-foreground">
                      {e.stepName}
                    </span>
                    <span className="truncate text-[10px] text-muted-foreground">
                      {e.projectName}
                    </span>
                  </div>
                ))}
              </div>
              {rest.length > 0 && (
                <div className="group relative mt-auto text-[11px] font-medium text-muted-foreground">
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 hover:bg-accent">
                    +{rest.length} weitere
                  </span>
                  <div
                    className={cn(
                      "absolute bottom-0 right-0 z-20 hidden min-w-48 flex-col gap-1 rounded-lg border bg-popover p-1.5 shadow-md group-hover:flex",
                    )}
                  >
                    {rest.map((e, j) => (
                      <div
                        key={j}
                        className="flex flex-col gap-0 overflow-hidden rounded-md border-l-[3px] py-0.5 pr-1.5 pl-1.5 leading-tight"
                        style={{
                          borderLeftColor: e.projectColor,
                          backgroundColor: `${e.projectColor}1a`,
                        }}
                      >
                        <span className="truncate text-[11px] font-medium text-foreground">
                          {e.stepName}
                        </span>
                        <span className="truncate text-[10px] text-muted-foreground">
                          {e.projectName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
