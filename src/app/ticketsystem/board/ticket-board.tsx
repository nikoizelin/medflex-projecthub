"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { createTicket, deleteTicket, updateTicket, updateTicketStatus } from "../actions";

type TicketStatus = "NEU" | "IN_PROGRESS" | "DONE";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  creatorName: string;
  assigneeId: string | null;
  assigneeName: string | null;
  createdAt: string;
}

interface UserOption {
  id: string;
  name: string;
}

const COLUMNS: { status: TicketStatus; label: string; dot: string; badge: string }[] = [
  { status: "NEU", label: "Neu", dot: "bg-blue-500", badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { status: "IN_PROGRESS", label: "In Progress", dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { status: "DONE", label: "Done", dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
];

const COLUMN_BY_STATUS = Object.fromEntries(COLUMNS.map((c) => [c.status, c])) as Record<
  TicketStatus,
  (typeof COLUMNS)[number]
>;

const dateFormatter = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

type Action =
  | { type: "status"; id: string; status: TicketStatus }
  | { type: "update"; id: string; title: string; description: string; assigneeId: string | null; assigneeName: string | null }
  | { type: "delete"; id: string };

export function TicketBoard({ tickets, users }: { tickets: Ticket[]; users: UserOption[] }) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dragOverCol, setDragOverCol] = useState<TicketStatus | null>(null);
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("alle");
  const [, startTransition] = useTransition();

  const [optimisticTickets, applyOptimistic] = useOptimistic(
    tickets,
    (state: Ticket[], action: Action) => {
      switch (action.type) {
        case "status":
          return state.map((t) => (t.id === action.id ? { ...t, status: action.status } : t));
        case "update":
          return state.map((t) =>
            t.id === action.id
              ? {
                  ...t,
                  title: action.title,
                  description: action.description,
                  assigneeId: action.assigneeId,
                  assigneeName: action.assigneeName,
                }
              : t
          );
        case "delete":
          return state.filter((t) => t.id !== action.id);
      }
    }
  );

  const filteredTickets = useMemo(() => {
    return optimisticTickets.filter((t) => {
      if (
        search &&
        !t.title.toLowerCase().includes(search.toLowerCase()) &&
        !t.description.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (assigneeFilter === "unzugewiesen" && t.assigneeId) return false;
      if (assigneeFilter !== "alle" && assigneeFilter !== "unzugewiesen" && t.assigneeId !== assigneeFilter) {
        return false;
      }
      return true;
    });
  }, [optimisticTickets, search, assigneeFilter]);

  const selected = selectedId ? optimisticTickets.find((t) => t.id === selectedId) ?? null : null;

  const changeStatus = (id: string, status: TicketStatus) => {
    startTransition(async () => {
      applyOptimistic({ type: "status", id, status });
      await updateTicketStatus(id, status);
    });
  };

  const closeDetail = () => {
    setSelectedId(null);
    setIsEditing(false);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative max-w-70 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tickets durchsuchen..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={assigneeFilter} onValueChange={(v) => v && setAssigneeFilter(v)}>
          <SelectTrigger className="w-44">
            <SelectValue>
              {assigneeFilter === "alle"
                ? "Alle Mitarbeiter"
                : assigneeFilter === "unzugewiesen"
                  ? "Unzugewiesen"
                  : users.find((u) => u.id === assigneeFilter)?.name ?? "Alle Mitarbeiter"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Mitarbeiter</SelectItem>
            <SelectItem value="unzugewiesen">Unzugewiesen</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Neues Ticket
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Ticket</DialogTitle>
            </DialogHeader>
            <form
              action={async (formData) => {
                await createTicket(formData);
                setOpen(false);
              }}
              className="flex min-w-0 flex-col gap-3"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Titel</Label>
                <Input id="title" name="title" placeholder="Kurzer Titel" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Details zum Ticket..."
                  rows={4}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="assigneeId">Zugewiesen an</Label>
                <select
                  id="assigneeId"
                  name="assigneeId"
                  defaultValue=""
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Niemand</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" />}>
                  Abbrechen
                </DialogClose>
                <Button type="submit">Ticket erstellen</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = filteredTickets.filter((t) => t.status === col.status);
          return (
            <div key={col.status} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", col.dot)} />
                <p className="text-sm font-medium">{col.label}</p>
                <span className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs", col.badge)}>
                  {items.length}
                </span>
              </div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverCol(col.status);
                }}
                onDragLeave={() => setDragOverCol((c) => (c === col.status ? null : c))}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverCol(null);
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) changeStatus(id, col.status);
                }}
                className={cn(
                  "flex min-h-24 flex-col gap-2 rounded-lg border bg-muted/30 p-2 transition-colors",
                  dragOverCol === col.status && "border-foreground/30 bg-muted/60"
                )}
              >
                {items.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", ticket.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => setSelectedId(ticket.id)}
                    className={cn(
                      "flex flex-col gap-1 rounded-lg border-l-[3px] border-y border-r bg-background p-2.5 text-left transition-colors hover:border-foreground/20 cursor-grab active:cursor-grabbing",
                      col.status === "NEU" && "border-l-blue-500",
                      col.status === "IN_PROGRESS" && "border-l-amber-500",
                      col.status === "DONE" && "border-l-emerald-500"
                    )}
                  >
                    <p className="text-sm font-medium">{ticket.title}</p>
                    {ticket.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {ticket.description}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {ticket.creatorName} · {dateFormatter.format(new Date(ticket.createdAt))}
                    </p>
                    {ticket.assigneeName && (
                      <span className="mt-0.5 inline-flex w-fit items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                        {ticket.assigneeName}
                      </span>
                    )}
                  </button>
                ))}
                {items.length === 0 && (
                  <p className="px-1 py-2 text-center text-xs text-muted-foreground">
                    Keine Tickets
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && closeDetail()}>
        {selected && (
          <DialogContent>
            {isEditing ? (
              <form
                action={async (formData) => {
                  const title = String(formData.get("title") ?? "").trim();
                  const description = String(formData.get("description") ?? "").trim();
                  const assigneeId = String(formData.get("assigneeId") ?? "").trim() || null;
                  if (!title) return;
                  setIsEditing(false);
                  startTransition(async () => {
                    applyOptimistic({
                      type: "update",
                      id: selected.id,
                      title,
                      description,
                      assigneeId,
                      assigneeName: users.find((u) => u.id === assigneeId)?.name ?? null,
                    });
                    await updateTicket(selected.id, { title, description, assigneeId });
                  });
                }}
                className="flex min-w-0 flex-col gap-3"
              >
                <DialogHeader>
                  <DialogTitle>Ticket bearbeiten</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-title">Titel</Label>
                  <Input id="edit-title" name="title" defaultValue={selected.title} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-description">Beschreibung</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    defaultValue={selected.description}
                    rows={4}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-assigneeId">Zugewiesen an</Label>
                  <select
                    id="edit-assigneeId"
                    name="assigneeId"
                    defaultValue={selected.assigneeId ?? ""}
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">Niemand</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Abbrechen
                  </Button>
                  <Button type="submit">Speichern</Button>
                </DialogFooter>
              </form>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="wrap-anywhere">{selected.title}</DialogTitle>
                  <DialogDescription>
                    Erstellt von {selected.creatorName} am{" "}
                    {dateFormatter.format(new Date(selected.createdAt))}
                    {selected.assigneeName && <> · Zugewiesen an {selected.assigneeName}</>}
                  </DialogDescription>
                </DialogHeader>

                {selected.description && (
                  <p className="whitespace-pre-wrap wrap-anywhere text-sm">{selected.description}</p>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label>Status</Label>
                  <Select
                    value={selected.status}
                    onValueChange={(v) => v && changeStatus(selected.id, v as TicketStatus)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{COLUMN_BY_STATUS[selected.status].label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMNS.map((col) => (
                        <SelectItem key={col.status} value={col.status}>
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="sm:justify-between">
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                        />
                      }
                    >
                      <Trash2 className="size-4" />
                      Löschen
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ticket löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          &quot;{selected.title}&quot; wird unwiderruflich gelöscht.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => {
                            const id = selected.id;
                            closeDetail();
                            startTransition(async () => {
                              applyOptimistic({ type: "delete", id });
                              await deleteTicket(id);
                            });
                          }}
                        >
                          Löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
                    <Pencil className="size-4" />
                    Bearbeiten
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
