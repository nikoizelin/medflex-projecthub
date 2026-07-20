"use client";

import {
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  ExternalLink,
  FileDown,
  ImageIcon,
  Search,
  X,
} from "lucide-react";
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
import {
  updateChangeRequestStatus,
  updateChangeRequestPriority,
  updateChangeRequestAssignee,
} from "../actions";

// ── Types ──────────────────────────────────────────────────────────────────

interface Screenshot {
  id: string;
  filename: string;
  mimeType: string;
  data: string;
}

interface ChangeEntry {
  id: string;
  supportRequestId: string;
  datum: string;
  kategorie: string;
  prioritaet: string;
  beschreibungProblem: string;
  linkAnfrage: string;
  fehlerhaftesVerhalten: string;
  erwartesVerhalten: string;
  status: string;
  assigneeId: string | null;
  assigneeName: string | null;
  kommentar: string;
  screenshots: Screenshot[];
  createdAt: string;
}

interface SupportRequestData {
  id: string;
  kontaktperson: string;
  praxisKunde: string;
  email: string;
  createdAt: string;
  entries: ChangeEntry[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

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

const KATEGORIE_LABEL: Record<string, string> = {
  telefonassistent: "Telefonassistent",
  "medflex-app": "MedFlex App",
  sonstiges: "Sonstiges",
  featurewunsch: "Featurewunsch",
};

const KATEGORIE_BADGE: Record<string, string> = {
  telefonassistent: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "medflex-app": "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  sonstiges: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  featurewunsch: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

const PRIORITY_SORT: Record<string, number> = {
  kritisch: 0,
  hoch: 1,
  mittel: 2,
  niedrig: 3,
};

const dateTimeFormatter = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

// ── ScreenshotViewer ────────────────────────────────────────────────────────

function ScreenshotViewer({ screenshots }: { screenshots: Screenshot[] }) {
  const [active, setActive] = useState<Screenshot | null>(null);
  if (!screenshots.length) return null;
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {screenshots.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s)}
            className="group relative size-12 overflow-hidden rounded border hover:ring-2 hover:ring-primary"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:${s.mimeType};base64,${s.data}`}
              alt={s.filename}
              className="size-full object-cover"
            />
          </button>
        ))}
      </div>
      {active && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:${active.mimeType};base64,${active.data}`}
              alt={active.filename}
              className="rounded-lg"
            />
            <button
              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black"
              onClick={() => setActive(null)}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Detail Dialog ───────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 border-t py-2.5 first:border-t-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm">{value}</p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

type OptimisticEntry = ChangeEntry;
type OptimisticPatch = Partial<Pick<ChangeEntry, "status" | "prioritaet" | "assigneeId" | "assigneeName">>;

export function AnfragenTable({
  supportRequests,
  users,
}: {
  supportRequests: SupportRequestData[];
  users: User[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [priorityFilter, setPriorityFilter] = useState("alle");
  const [kategorieFilter, setKategorieFilter] = useState("alle");
  const [assigneeFilter, setAssigneeFilter] = useState("alle");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [checkedEntryIds, setCheckedEntryIds] = useState<Set<string>>(new Set());
  const [selectedEntry, setSelectedEntry] = useState<{ entry: ChangeEntry; sr: SupportRequestData } | null>(null);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/support/neue-anfrage`
      : "/support/neue-anfrage";

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Flat optimistic state over all entries
  const allEntries = useMemo(
    () => supportRequests.flatMap((sr) => sr.entries),
    [supportRequests]
  );

  const [optimisticEntries, applyOptimistic] = useOptimistic(
    allEntries,
    (state: OptimisticEntry[], patch: { id: string } & OptimisticPatch) =>
      state.map((e) => (e.id === patch.id ? { ...e, ...patch } : e))
  );

  // Rebuild nested structure from optimistic flat list
  const optimisticRequests = useMemo(() => {
    const entryMap = new Map(optimisticEntries.map((e) => [e.id, e]));
    return supportRequests.map((sr) => ({
      ...sr,
      entries: sr.entries.map((e) => entryMap.get(e.id) ?? e),
    }));
  }, [supportRequests, optimisticEntries]);

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

  const changeAssignee = (id: string, assigneeId: string | null) => {
    const user = users.find((u) => u.id === assigneeId) ?? null;
    startTransition(async () => {
      applyOptimistic({ id, assigneeId, assigneeName: user?.name ?? null });
      await updateChangeRequestAssignee(id, assigneeId);
    });
  };

  // Filter logic
  const filteredRequests = useMemo(() => {
    return optimisticRequests
      .map((sr) => {
        const matchingEntries = sr.entries.filter((e) => {
          if (statusFilter !== "alle" && e.status !== statusFilter) return false;
          if (priorityFilter !== "alle" && e.prioritaet !== priorityFilter) return false;
          if (kategorieFilter !== "alle" && e.kategorie !== kategorieFilter) return false;
          if (assigneeFilter !== "alle") {
            if (assigneeFilter === "niemand" && e.assigneeId) return false;
            if (assigneeFilter !== "niemand" && e.assigneeId !== assigneeFilter) return false;
          }
          if (search) {
            const q = search.toLowerCase();
            if (
              !sr.kontaktperson.toLowerCase().includes(q) &&
              !sr.praxisKunde.toLowerCase().includes(q) &&
              !e.beschreibungProblem.toLowerCase().includes(q) &&
              !e.kategorie.toLowerCase().includes(q)
            )
              return false;
          }
          return true;
        });
        return { ...sr, entries: matchingEntries };
      })
      .filter((sr) => sr.entries.length > 0);
  }, [optimisticRequests, search, statusFilter, priorityFilter, kategorieFilter, assigneeFilter]);

  const allFilteredEntryIds = useMemo(
    () => filteredRequests.flatMap((sr) => sr.entries.map((e) => e.id)),
    [filteredRequests]
  );
  const checkedInView = allFilteredEntryIds.filter((id) => checkedEntryIds.has(id));

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const toggleEntryCheck = (id: string) =>
    setCheckedEntryIds((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const toggleSrCheck = (sr: SupportRequestData) => {
    const ids = sr.entries.map((e) => e.id);
    const allChecked = ids.every((id) => checkedEntryIds.has(id));
    setCheckedEntryIds((prev) => {
      const s = new Set(prev);
      if (allChecked) ids.forEach((id) => s.delete(id));
      else ids.forEach((id) => s.add(id));
      return s;
    });
  };

  const exportDocx = async () => {
    const { generateChangeRequestDocx } = await import("../docx-export");
    const toExport = filteredRequests.flatMap((sr) =>
      sr.entries
        .filter((e) => checkedInView.length === 0 || checkedEntryIds.has(e.id))
        .map((e) => ({
          kontaktperson: sr.kontaktperson,
          praxisKunde: sr.praxisKunde,
          email: sr.email,
          datum: e.datum,
          kategorie: e.kategorie,
          prioritaet: e.prioritaet,
          beschreibungProblem: e.beschreibungProblem,
          linkAnfrage: e.linkAnfrage,
          fehlerhaftesVerhalten: e.fehlerhaftesVerhalten,
          erwartesVerhalten: e.erwartesVerhalten,
          status: e.status,
          kommentar: e.kommentar,
        }))
    );
    await generateChangeRequestDocx(toExport);
  };

  const totalEntries = filteredRequests.reduce((n, sr) => n + sr.entries.length, 0);

  return (
    <>
      {/* Kundenlink-Box */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/30 px-3.5 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-xs font-medium text-muted-foreground">Kundenformular-Link</p>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 truncate font-mono text-sm text-primary hover:underline"
          >
            {publicUrl}
            <ExternalLink className="size-3 shrink-0" />
          </a>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={copyLink} className="shrink-0">
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          {copied ? "Kopiert" : "Kopieren"}
        </Button>
      </div>

      {/* Filter-Zeile */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative max-w-64 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Suchen…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={kategorieFilter} onValueChange={(v) => v && setKategorieFilter(v)}>
          <SelectTrigger className="w-44">
            <SelectValue>
              {kategorieFilter === "alle"
                ? "Alle Kategorien"
                : KATEGORIE_LABEL[kategorieFilter] ?? kategorieFilter}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Kategorien</SelectItem>
            {Object.entries(KATEGORIE_LABEL).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-44">
            <SelectValue>
              {statusFilter === "alle"
                ? "Alle Status"
                : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(v) => v && setPriorityFilter(v)}>
          <SelectTrigger className="w-36">
            <SelectValue>
              {priorityFilter === "alle"
                ? "Alle Prioritäten"
                : PRIORITY_LABEL[priorityFilter] ?? priorityFilter}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Prioritäten</SelectItem>
            {Object.entries(PRIORITY_LABEL).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={assigneeFilter} onValueChange={(v) => v && setAssigneeFilter(v)}>
          <SelectTrigger className="w-44">
            <SelectValue>
              {assigneeFilter === "alle"
                ? "Alle Bearbeiter"
                : assigneeFilter === "niemand"
                ? "Nicht zugewiesen"
                : users.find((u) => u.id === assigneeFilter)?.name ?? "Bearbeiter"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Bearbeiter</SelectItem>
            <SelectItem value="niemand">Nicht zugewiesen</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="ml-auto text-xs text-muted-foreground">
          {checkedInView.length > 0
            ? `${checkedInView.length} von ${totalEntries} ausgewählt`
            : `${filteredRequests.length} Anfragen · ${totalEntries} Einträge`}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={exportDocx}
          disabled={totalEntries === 0}
        >
          <FileDown className="size-4" />
          {checkedInView.length > 0
            ? `${checkedInView.length} exportieren`
            : "Alle exportieren"}
        </Button>
      </div>

      {/* Tabelle */}
      {filteredRequests.length === 0 ? (
        <div className="rounded-lg border bg-background py-16 text-center">
          <p className="text-sm text-muted-foreground">Keine Anfragen gefunden.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredRequests.map((sr) => {
            const expanded = expandedIds.has(sr.id);
            const srEntryIds = sr.entries.map((e) => e.id);
            const srAllChecked =
              srEntryIds.length > 0 && srEntryIds.every((id) => checkedEntryIds.has(id));
            const srSomeChecked =
              srEntryIds.some((id) => checkedEntryIds.has(id)) && !srAllChecked;

            return (
              <div key={sr.id} className="overflow-hidden rounded-lg border bg-background">
                {/* Parent row */}
                <div
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/20"
                  onClick={() => toggleExpand(sr.id)}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSrCheck(sr);
                    }}
                  >
                    <Checkbox
                      checked={srAllChecked}
                      data-state={
                        srSomeChecked ? "indeterminate" : srAllChecked ? "checked" : "unchecked"
                      }
                      onCheckedChange={() => toggleSrCheck(sr)}
                      aria-label="Alle Einträge auswählen"
                    />
                  </div>

                  {expanded ? (
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{sr.praxisKunde || "—"}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-sm text-muted-foreground">{sr.kontaktperson}</span>
                      {sr.email && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{sr.email}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {sr.entries.length}{" "}
                      {sr.entries.length === 1 ? "Eintrag" : "Einträge"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {dateTimeFormatter.format(new Date(sr.createdAt))}
                    </span>
                  </div>
                </div>

                {/* Sub-entries */}
                {expanded && (
                  <div className="border-t">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b bg-muted/20">
                          <tr>
                            <th className="w-10 px-3 py-2" />
                            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                              Kategorie
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                              Datum
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                              Beschreibung
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                              Priorität
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                              Status
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                              Bearbeiter
                            </th>
                            <th className="w-16 px-3 py-2" />
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {sr.entries.map((entry) => (
                            <tr
                              key={entry.id}
                              className={cn(
                                "hover:bg-muted/10",
                                checkedEntryIds.has(entry.id) && "bg-muted/10"
                              )}
                            >
                              <td
                                className="px-3 py-2.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Checkbox
                                  checked={checkedEntryIds.has(entry.id)}
                                  onCheckedChange={() => toggleEntryCheck(entry.id)}
                                  aria-label="Auswählen"
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                                    KATEGORIE_BADGE[entry.kategorie] ??
                                      "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {KATEGORIE_LABEL[entry.kategorie] ?? entry.kategorie}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-xs">
                                {dateFormatter.format(
                                  new Date(entry.datum + "T00:00:00")
                                )}
                              </td>
                              <td className="max-w-[200px] px-3 py-2.5">
                                <p className="line-clamp-2 text-xs">
                                  {entry.beschreibungProblem || "—"}
                                </p>
                                {entry.screenshots.length > 0 && (
                                  <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <ImageIcon className="size-3" />
                                    {entry.screenshots.length}
                                  </div>
                                )}
                              </td>
                              <td
                                className="px-3 py-2.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Select
                                  value={entry.prioritaet}
                                  onValueChange={(v) => v && changePriority(entry.id, v)}
                                >
                                  <SelectTrigger
                                    className={cn(
                                      "h-7 w-28 border-0 bg-transparent px-2 text-[11px] font-medium shadow-none focus:ring-0",
                                      PRIORITY_BADGE[entry.prioritaet] ?? ""
                                    )}
                                  >
                                    <SelectValue>
                                      {PRIORITY_LABEL[entry.prioritaet] ?? entry.prioritaet}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(PRIORITY_LABEL).map(([v, l]) => (
                                      <SelectItem key={v} value={v}>{l}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td
                                className="px-3 py-2.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Select
                                  value={entry.status}
                                  onValueChange={(v) => v && changeStatus(entry.id, v)}
                                >
                                  <SelectTrigger
                                    className={cn(
                                      "h-7 w-36 border-0 bg-transparent px-2 text-xs font-medium shadow-none focus:ring-0",
                                      STATUS_BADGE[entry.status] ?? ""
                                    )}
                                  >
                                    <SelectValue>
                                      {entry.status.charAt(0).toUpperCase() +
                                        entry.status.slice(1)}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map((s) => (
                                      <SelectItem key={s} value={s}>
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td
                                className="px-3 py-2.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Select
                                  value={entry.assigneeId ?? "niemand"}
                                  onValueChange={(v) =>
                                    changeAssignee(entry.id, v === "niemand" ? null : v)
                                  }
                                >
                                  <SelectTrigger className="h-7 w-40 border-0 bg-transparent px-2 text-xs shadow-none focus:ring-0">
                                    <SelectValue>
                                      {entry.assigneeName ?? (
                                        <span className="text-muted-foreground">
                                          Nicht zugewiesen
                                        </span>
                                      )}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="niemand">
                                      Nicht zugewiesen
                                    </SelectItem>
                                    {users.map((u) => (
                                      <SelectItem key={u.id} value={u.id}>
                                        {u.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-3 py-2.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setSelectedEntry({ entry, sr })}
                                >
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
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedEntry}
        onOpenChange={(v) => !v && setSelectedEntry(null)}
      >
        {selectedEntry && (
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {KATEGORIE_LABEL[selectedEntry.entry.kategorie] ??
                  selectedEntry.entry.kategorie}
              </DialogTitle>
              <DialogDescription>
                {selectedEntry.sr.praxisKunde} · {selectedEntry.sr.kontaktperson} ·{" "}
                {dateFormatter.format(
                  new Date(selectedEntry.entry.datum + "T00:00:00")
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  KATEGORIE_BADGE[selectedEntry.entry.kategorie] ??
                    "bg-muted text-muted-foreground"
                )}
              >
                {KATEGORIE_LABEL[selectedEntry.entry.kategorie] ??
                  selectedEntry.entry.kategorie}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  PRIORITY_BADGE[selectedEntry.entry.prioritaet] ?? "bg-muted text-muted-foreground"
                )}
              >
                {PRIORITY_LABEL[selectedEntry.entry.prioritaet] ?? selectedEntry.entry.prioritaet}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  STATUS_BADGE[selectedEntry.entry.status] ?? "bg-muted text-muted-foreground"
                )}
              >
                {selectedEntry.entry.status.charAt(0).toUpperCase() +
                  selectedEntry.entry.status.slice(1)}
              </span>
            </div>

            <div className="rounded-lg border bg-muted/20 px-4 py-1">
              <DetailRow label="Kontaktperson" value={selectedEntry.sr.kontaktperson} />
              <DetailRow label="Praxis / Kunde" value={selectedEntry.sr.praxisKunde} />
              <DetailRow label="E-Mail" value={selectedEntry.sr.email} />
              <DetailRow label="Beschreibung" value={selectedEntry.entry.beschreibungProblem} />
              <DetailRow
                label="Fehlerhaftes Verhalten"
                value={selectedEntry.entry.fehlerhaftesVerhalten}
              />
              <DetailRow
                label="Erwartetes Verhalten"
                value={selectedEntry.entry.erwartesVerhalten}
              />
              {selectedEntry.entry.linkAnfrage && (
                <div className="grid grid-cols-[160px_1fr] gap-3 border-t py-2.5">
                  <p className="text-xs font-medium text-muted-foreground">Link</p>
                  <a
                    href={selectedEntry.entry.linkAnfrage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {selectedEntry.entry.linkAnfrage}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>

            {selectedEntry.entry.screenshots.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Screenshots</p>
                <ScreenshotViewer screenshots={selectedEntry.entry.screenshots} />
              </div>
            )}

            {selectedEntry.entry.kommentar && (
              <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-3 dark:bg-amber-950/20">
                <p className="mb-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                  Interner Kommentar
                </p>
                <p className="whitespace-pre-wrap text-sm">
                  {selectedEntry.entry.kommentar}
                </p>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
