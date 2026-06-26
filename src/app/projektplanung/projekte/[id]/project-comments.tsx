"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, MessageSquare, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { createProjectComment, deleteProjectComment } from "../../actions";

export interface ProjectComment {
  id: string;
  message: string;
  createdAt: string;
  authorId: string;
  authorName: string;
}

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
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type Action =
  | { type: "add"; comment: ProjectComment }
  | { type: "delete"; id: string };

export function ProjectComments({
  projectId,
  comments,
  currentUserId,
  currentUserName,
}: {
  projectId: string;
  comments: ProjectComment[];
  currentUserId: string;
  currentUserName: string;
}) {
  const [open, setOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [, startTransition] = useTransition();

  const [optimisticComments, applyOptimistic] = useOptimistic(
    comments,
    (state: ProjectComment[], action: Action) => {
      switch (action.type) {
        case "add":
          return [action.comment, ...state];
        case "delete":
          return state.filter((c) => c.id !== action.id);
      }
    }
  );

  const submit = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    setMessage("");
    startTransition(async () => {
      applyOptimistic({
        type: "add",
        comment: {
          id: `temp-${Date.now()}`,
          message: trimmed,
          createdAt: new Date().toISOString(),
          authorId: currentUserId,
          authorName: currentUserName,
        },
      });
      await createProjectComment(projectId, trimmed);
    });
  };

  return (
    <div className="mt-3.5 rounded-lg border bg-background">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 p-3"
      >
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <MessageSquare className="size-4" />
          Kommentare
          {optimisticComments.length > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
              {optimisticComments.length}
            </span>
          )}
        </p>
        {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t p-3">
          <div className="mb-3 flex flex-col gap-1.5 sm:flex-row sm:items-start">
            <Textarea
              placeholder="Projektinformationen, Details oder Notizen..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="flex-1 text-sm"
            />
            <Button type="button" size="sm" onClick={submit} disabled={!message.trim()}>
              <Send className="size-3.5" />
              Kommentieren
            </Button>
          </div>

          {optimisticComments.length === 0 ? (
            <p className="py-2 text-center text-xs text-muted-foreground">Noch keine Kommentare.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {optimisticComments.map((c) => (
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
                                      applyOptimistic({ type: "delete", id: c.id });
                                      await deleteProjectComment(c.id, projectId);
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
  );
}
