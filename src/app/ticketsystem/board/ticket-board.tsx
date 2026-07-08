"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, MessageSquare, Pencil, Plus, Search, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  createTicket,
  deleteTicket,
  updateTicket,
  updateTicketStatus,
  createTicketComment,
  deleteTicketComment,
} from "../actions";
import { TicketPriority } from "@/generated/prisma";

type TicketStatus = "NEU" | "IN_PROGRESS" | "DONE";

interface TicketComment {
  id: string;
  message: string;
  createdAt: string;
  authorId: string;
  authorName: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  creatorName: string;
  assigneeId: string | null;
  assigneeName: string | null;
  createdAt: string;
  comments: TicketComment[];
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

const PRIORITIES: { value: TicketPriority; label: string; dot: string; badge: string }[] = [
  { value: "HOCH", label: "Hoch", dot: "bg-red-500", badge: "bg-red-500/10 text-red-600 dark:text-red-400" },
  { value: "MITTEL", label: "Mittel", dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { value: "NIEDRIG", label: "Niedrig", dot: "bg-slate-400", badge: "bg-slate-400/10 text-slate-500 dark:text-slate-400" },
];

const PRIORITY_BY_VALUE = Object.fromEntries(PRIORITIES.map((p) => [p.value, p])) as Record<
  TicketPriority,
  (typeof PRIORITIES)[number]
>;

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

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type Action =
  | { type: "status"; id: string; status: TicketStatus }
  | { type: "update"; id: string; title: string; description: string; priority: TicketPriority; assigneeId: string | null; assigneeName: string | null }
  | { type: "delete"; id: string }
  | { type: "addComment"; ticketId: string; comment: TicketComment }
  | { type: "deleteComment"; ticketId: string; commentId: string };

export function TicketBoard({
  tickets,
  users,
  currentUserId,
  currentUserName,
}: {
  tickets: Ticket[];
  users: UserOption[];
  currentUserId: string;
  currentUserName: string;
}) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dragOverCol, setDragOverCol] = useState<TicketStatus | null>(null);
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("alle");
  const [commentOpen, setCommentOpen] = useState(true);
  const [commentMessage, setCommentMessage] = useState("");
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
              ? { ...t, title: action.title, description: action.description, priority: action.priority, assigneeId: action.assigneeId, assigneeName: action.assigneeName }
              : t
          );
        case "delete":
          return state.filter((t) => t.id !== action.id);
        case "addComment":
          return state.map((t) =>
            t.id === action.ticketId
              ? { ...t, comments: [action.comment, ...t.comments] }
              : t
          );
        case "deleteComment":
          return state.map((t) =>
            t.id === action.ticketId
              ? { ...t, comments: t.comments.filter((c) => c.id !== action.commentId) }
              : t
          );
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
    setCommentMessage("");
    setCommentOpen(true);
  };

  const submitComment = () => {
    const trimmed = commentMessage.trim();
    if (!trimmed || !selectedId) return;
    setCommentMessage("");
    startTransition(async () => {
      applyOptimistic({
        type: "addComment",
        ticketId: selectedId,
        comment: {
          id: `temp-${Date.now()}`,
          message: trimmed,
          createdAt: new Date().toISOString(),
          authorId: currentUserId,
          authorName: currentUserName,
        },
      });
      await createTicketComment(selectedId, trimmed);
    });
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
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="priority">Priorität</Label>
                  <select
                    id="priority"
                    name="priority"
                    defaultValue="MITTEL"
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
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
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
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
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.status); }}
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
                {items.map((ticket) => {
                  const prio = PRIORITY_BY_VALUE[ticket.priority];
                  return (
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
                      <div className="flex items-start justify-between gap-1.5">
                        <p className="text-sm font-medium leading-snug">{ticket.title}</p>
                        <span className={cn("mt-0.5 shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", prio.badge)}>
                          <span className={cn("size-1.5 rounded-full", prio.dot)} />
                          {prio.label}
                        </span>
                      </div>
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
                  );
                })}
                {items.length === 0 && (
                  <p className="px-1 py-2 text-center text-xs text-muted-foreground">Keine Tickets</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && closeDetail()}>
        {selected && (
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            {isEditing ? (
              <form
                action={async (formData) => {
                  const title = String(formData.get("title") ?? "").trim();
                  const description = String(formData.get("description") ?? "").trim();
                  const assigneeId = String(formData.get("assigneeId") ?? "").trim() || null;
                  const priorityRaw = String(formData.get("priority") ?? "MITTEL") as TicketPriority;
                  if (!title) return;
                  setIsEditing(false);
                  startTransition(async () => {
                    applyOptimistic({
                      type: "update",
                      id: selected.id,
                      title,
                      description,
                      priority: priorityRaw,
                      assigneeId,
                      assigneeName: users.find((u) => u.id === assigneeId)?.name ?? null,
                    });
                    await updateTicket(selected.id, { title, description, assigneeId, priority: priorityRaw });
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="edit-priority">Priorität</Label>
                    <select
                      id="edit-priority"
                      name="priority"
                      defaultValue={selected.priority}
                      className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
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
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
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
                  <div className="flex items-start gap-2 pr-4">
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="wrap-anywhere">{selected.title}</DialogTitle>
                      <DialogDescription className="mt-1">
                        Erstellt von {selected.creatorName} am{" "}
                        {dateFormatter.format(new Date(selected.createdAt))}
                        {selected.assigneeName && <> · Zugewiesen an {selected.assigneeName}</>}
                      </DialogDescription>
                    </div>
                    <span className={cn("mt-0.5 shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", PRIORITY_BY_VALUE[selected.priority].badge)}>
                      <span className={cn("size-1.5 rounded-full", PRIORITY_BY_VALUE[selected.priority].dot)} />
                      {PRIORITY_BY_VALUE[selected.priority].label}
                    </span>
                  </div>
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

                {/* Comments Section */}
                <div className="rounded-lg border bg-background">
                  <button
                    type="button"
                    onClick={() => setCommentOpen((v) => !v)}
                    className="flex w-full items-center justify-between gap-2 p-3"
                  >
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <MessageSquare className="size-4" />
                      Kommentare
                      {selected.comments.length > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
                          {selected.comments.length}
                        </span>
                      )}
                    </p>
                    {commentOpen ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </button>

                  {commentOpen && (
                    <div className="border-t p-3">
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start">
                        <Textarea
                          placeholder="Kommentar hinzufügen..."
                          value={commentMessage}
                          onChange={(e) => setCommentMessage(e.target.value)}
                          rows={2}
                          className="flex-1 text-sm"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={submitComment}
                          disabled={!commentMessage.trim()}
                        >
                          <Send className="size-3.5" />
                          Senden
                        </Button>
                      </div>

                      {selected.comments.length === 0 ? (
                        <p className="py-2 text-center text-xs text-muted-foreground">Noch keine Kommentare.</p>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          {selected.comments.map((c) => (
                            <div key={c.id} className="group flex gap-2 rounded-lg border bg-muted/20 p-2.5">
                              <Avatar className="size-7 shrink-0">
                                <AvatarFallback className="text-[11px] font-medium">
                                  {initials(c.authorName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-medium">{c.authorName}</p>
                                  <div className="flex items-center gap-1">
                                    <p className="text-[11px] text-muted-foreground">
                                      {dateTimeFormatter.format(new Date(c.createdAt))}
                                    </p>
                                    {c.authorId === currentUserId && (
                                      <AlertDialog>
                                        <AlertDialogTrigger
                                          render={
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon-xs"
                                              className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                                              aria-label="Kommentar löschen"
                                            />
                                          }
                                        >
                                          <Trash2 className="size-3" />
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Kommentar löschen?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Der Kommentar wird unwiderruflich gelöscht.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                            <AlertDialogAction
                                              variant="destructive"
                                              onClick={() =>
                                                startTransition(async () => {
                                                  applyOptimistic({ type: "deleteComment", ticketId: selected.id, commentId: c.id });
                                                  await deleteTicketComment(c.id);
                                                })
                                              }
                                            >
                                              Löschen
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}
                                  </div>
                                </div>
                                <p className="mt-0.5 whitespace-pre-wrap wrap-anywhere text-sm">{c.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
