"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { Check, ChevronDown, ChevronUp, Copy, ExternalLink, FileDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { updateChangeRequestStatus, updateChangeRequestPriority } from "../actions";

interface Anfrage {
  id: string;
  kontaktperson: string;
  praxisKunde: string;
  datum: string;
  prioritaet: string;
  beschreibungProblem: string;
  linkAnfrage: string;
  fehlerhaftesVerhalten: string;
  erwartesVerhalten: string;
  status: string;
  createdAt: string;
}

const PRIORITY_BADGE: Record<string, string> = {
  kritisch: "bg-red-500/10 text-red-700 dark:text-red-400",
  hoch: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  mittel: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  niedrig: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

const PRIORITY_LABEL: Record<string, string> = {
  kritisch: "Kritisch",
  hoch: "Hoch",
  mittel: "Mittel",
  niedrig: "Niedrig",
};

const STATUS_BADGE: Record<string, string> = {
  offen: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "in Bearbeitung": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  erledigt: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

const STATUS_OPTIONS = ["offen", "in Bearbeitung", "erledigt"];

const dateFormatter = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type SortKey = "createdAt" | "datum" | "praxisKunde" | "prioritaet" | "status";
type SortDir = "asc" | "desc";

const PRIORITY_ORDER: Record<string, number> = { kritisch: 0, hoch: 1, mittel: 2, niedrig: 3 };
const STATUS_ORDER: Record<string, number> = { offen: 0, "in Bearbeitung": 1, erledigt: 2 };

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-t py-2.5 first:border-t-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm">{value}</p>
    </div>
  );
}

export function AnfragenTable({ anfragen }: { anfragen: Anfrage[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [priorityFilter, setPriorityFilter] = useState("alle");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/support/neue-anfrage`
    : "/support/neue-anfrage";

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [optimistic, applyOptimistic] = useOptimistic(
    anfragen,
    (state: Anfrage[], patch: { id: string; status?: string; prioritaet?: string }) =>
      state.map((a) => (a.id === patch.id ? { ...a, ...patch } : a))
  );

  const changeStatus = (id: string, status: string) => {
    startTransition(async () => {
      applyOptimistic({ id, status });
      await updateChangeRequestStatus(id, status);
    });
  };

  const changePriority = (id: string, prioritaet: string) => {
    startTransition(async () => {
      applyOptimistic({ id, prioritaet });
      await updateChangeRequestPriority(id, prioritaet);
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    let result = optimistic.filter((a) => {
      if (
        search &&
        !a.kontaktperson.toLowerCase().includes(search.toLowerCase()) &&
        !a.praxisKunde.toLowerCase().includes(search.toLowerCase()) &&
        !a.beschreibungProblem.toLowerCase().includes(search.toLowerCase())
      ) return false;
      if (statusFilter !== "alle" && a.status !== statusFilter) return false;
      if (priorityFilter !== "alle" && a.prioritaet !== priorityFilter) return false;
      return true;
    });

    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "createdAt") cmp = a.createdAt.localeCompare(b.createdAt);
      else if (sortKey === "datum") cmp = a.datum.localeCompare(b.datum);
      else if (sortKey === "praxisKunde") cmp = a.praxisKunde.localeCompare(b.praxisKunde);
      else if (sortKey === "prioritaet") cmp = (PRIORITY_ORDER[a.prioritaet] ?? 9) - (PRIORITY_ORDER[b.prioritaet] ?? 9);
      else if (sortKey === "status") cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [optimistic, search, statusFilter, priorityFilter, sortKey, sortDir]);

  // Checkbox helpers
  const filteredIds = useMemo(() => new Set(filtered.map((a) => a.id)), [filtered]);
  const checkedInView = [...checkedIds].filter((id) => filteredIds.has(id));
  const allChecked = filtered.length > 0 && checkedInView.length === filtered.length;
  const someChecked = checkedInView.length > 0 && !allChecked;

  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds((prev) => { const s = new Set(prev); filtered.forEach((a) => s.delete(a.id)); return s; });
    } else {
      setCheckedIds((prev) => { const s = new Set(prev); filtered.forEach((a) => s.add(a.id)); return s; });
    }
  };

  const toggleOne = (id: string) => {
    setCheckedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const exportDocx = async () => {
    const { generateChangeRequestDocx } = await import("../docx-export");
    const toExport = checkedInView.length > 0
      ? filtered.filter((a) => checkedIds.has(a.id))
      : filtered;
    await generateChangeRequestDocx(toExport);
  };

  const selected = selectedId ? optimistic.find((a) => a.id === selectedId) ?? null : null;

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return null;
    return sortDir === "asc"
      ? <ChevronUp className="size-3.5 text-foreground" />
      : <ChevronDown className="size-3.5 text-foreground" />;
  }

  function Th({ col, label }: { col: SortKey; label: string }) {
    return (
      <th
        className="cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
        onClick={() => handleSort(col)}
      >
        <span className="inline-flex items-center gap-1">{label}<SortIcon col={col} /></span>
      </th>
    );
  }

  return (
    <>
      {/* Kundenlink-Box */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/30 px-3.5 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-xs font-medium text-muted-foreground">Kundenformular-Link</p>
          <p className="truncate text-sm font-mono text-foreground">{publicUrl}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={copyLink} className="shrink-0">
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          {copied ? "Kopiert" : "Kopieren"}
        </Button>
      </div>

      {/* Filter + Export */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative max-w-72 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Suchen…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-44">
            <SelectValue>{statusFilter === "alle" ? "Alle Status" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Status</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => v && setPriorityFilter(v)}>
          <SelectTrigger className="w-36">
            <SelectValue>{priorityFilter === "alle" ? "Alle Prioritäten" : PRIORITY_LABEL[priorityFilter] ?? priorityFilter}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Prioritäten</SelectItem>
            {Object.entries(PRIORITY_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="ml-auto text-xs text-muted-foreground">
          {checkedInView.length > 0
            ? `${checkedInView.length} von ${filtered.length} ausgewählt`
            : `${filtered.length} Einträge`}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={exportDocx} disabled={filtered.length === 0}>
          <FileDown className="size-4" />
          {checkedInView.length > 0 ? `${checkedInView.length} exportieren` : "Alle exportieren"}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-background py-16 text-center">
          <p className="text-sm text-muted-foreground">Keine Anfragen gefunden.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-background">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="w-10 px-3 py-2.5">
                    <Checkbox
                      checked={allChecked}
                      data-state={someChecked ? "indeterminate" : allChecked ? "checked" : "unchecked"}
                      onCheckedChange={toggleAll}
                      aria-label="Alle auswählen"
                    />
                  </th>
                  <Th col="datum" label="Datum" />
                  <Th col="praxisKunde" label="Praxis / Kunde" />
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Kontakt</th>
                  <Th col="prioritaet" label="Priorität" />
                  <Th col="status" label="Status" />
                  <Th col="createdAt" label="Eingegangen" />
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    className={cn("cursor-pointer transition-colors hover:bg-muted/20", checkedIds.has(a.id) && "bg-muted/10")}
                    onClick={() => setSelectedId(a.id)}
                  >
                    <td className="px-3 py-2.5" onClick={(e) => { e.stopPropagation(); toggleOne(a.id); }}>
                      <Checkbox checked={checkedIds.has(a.id)} onCheckedChange={() => toggleOne(a.id)} aria-label="Auswählen" />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      {dateFormatter.format(new Date(a.datum + "T00:00:00"))}
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-2.5 font-medium">{a.praxisKunde || "—"}</td>
                    <td className="max-w-[140px] truncate px-3 py-2.5 text-muted-foreground">{a.kontaktperson || "—"}</td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <Select value={a.prioritaet} onValueChange={(v) => v && changePriority(a.id, v)}>
                        <SelectTrigger className={cn("h-7 w-28 border-0 bg-transparent px-2 text-[11px] font-medium shadow-none focus:ring-0", PRIORITY_BADGE[a.prioritaet] ?? "")}>
                          <SelectValue>{PRIORITY_LABEL[a.prioritaet] ?? a.prioritaet}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PRIORITY_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <Select value={a.status} onValueChange={(v) => v && changeStatus(a.id, v)}>
                        <SelectTrigger className={cn("h-7 w-36 border-0 bg-transparent px-2 text-xs font-medium shadow-none focus:ring-0", STATUS_BADGE[a.status] ?? "")}>
                          <SelectValue>{a.status.charAt(0).toUpperCase() + a.status.slice(1)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                      {dateTimeFormatter.format(new Date(a.createdAt))}
                    </td>
                    <td className="px-3 py-2.5">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedId(a.id); }}>
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelectedId(null)}>
        {selected && (
          <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="wrap-anywhere">{selected.praxisKunde || "Anfrage"}</DialogTitle>
              <DialogDescription>
                {selected.kontaktperson && <>{selected.kontaktperson} · </>}
                Eingegangen {dateTimeFormatter.format(new Date(selected.createdAt))}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", PRIORITY_BADGE[selected.prioritaet] ?? "bg-muted text-muted-foreground")}>
                {PRIORITY_LABEL[selected.prioritaet] ?? selected.prioritaet}
              </span>
              <Select value={selected.status} onValueChange={(v) => v && changeStatus(selected.id, v)}>
                <SelectTrigger className={cn("h-7 w-auto border px-2.5 text-xs font-medium", STATUS_BADGE[selected.status] ?? "")}>
                  <SelectValue>{selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border bg-muted/20 px-4 py-1">
              <DetailRow label="Kontaktperson" value={selected.kontaktperson} />
              <DetailRow label="Praxis / Kunde" value={selected.praxisKunde} />
              <DetailRow label="Datum" value={dateFormatter.format(new Date(selected.datum + "T00:00:00"))} />
              <DetailRow label="Beschreibung" value={selected.beschreibungProblem} />
              <DetailRow label="Fehlerhaftes Verhalten" value={selected.fehlerhaftesVerhalten} />
              <DetailRow label="Erwartetes Verhalten" value={selected.erwartesVerhalten} />
              {selected.linkAnfrage && (
                <div className="grid grid-cols-[140px_1fr] gap-3 border-t py-2.5">
                  <p className="text-xs font-medium text-muted-foreground">Link</p>
                  <a href={selected.linkAnfrage} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}>
                    {selected.linkAnfrage}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
