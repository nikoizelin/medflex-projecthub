import { redirect } from "next/navigation";
import Link from "next/link";
import { ListChecks, ChartBar, KanbanSquare, TrendingUp } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/current-user";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar title="Module" userName={user.name} />
        <main className="flex-1 p-5">
          <h1 className="mb-1 text-lg font-semibold">Module</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            Wähle einen Bereich aus
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Link
              href="/projektplanung/uebersicht"
              className="rounded-lg border bg-background p-3.5 transition-colors hover:border-foreground/20"
            >
              <ListChecks className="size-6 text-primary" />
              <p className="mt-2.5 text-sm font-medium">Projektplanung</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Projekte, Zeitplan &amp; Kalender
              </p>
            </Link>

            <Link
              href="/ticketsystem/board"
              className="rounded-lg border bg-background p-3.5 transition-colors hover:border-foreground/20"
            >
              <KanbanSquare className="size-6 text-primary" />
              <p className="mt-2.5 text-sm font-medium">Ticketsystem</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tickets &amp; Board
              </p>
            </Link>

            <div className="relative rounded-lg border bg-background p-3.5 opacity-55">
              <Badge
                variant="secondary"
                className="absolute right-2.5 top-2.5 text-[10px]"
              >
                Bald verfügbar
              </Badge>
              <ChartBar className="size-6 text-muted-foreground" />
              <p className="mt-2.5 text-sm font-medium">Online Rezeption</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Chat mit Textbausteinen
              </p>
            </div>
            <Link
              href="/statistik/uebersicht"
              className="rounded-lg border bg-background p-3.5 transition-colors hover:border-foreground/20"
            >
              <ChartBar className="size-6 text-primary" />
              <p className="mt-2.5 text-sm font-medium">Statistik Builder</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Auswertungen &amp; Reports
              </p>
            </Link>

            <div className="relative rounded-lg border bg-background p-3.5 opacity-55">
              <Badge
                variant="secondary"
                className="absolute right-2.5 top-2.5 text-[10px]"
              >
                Bald verfügbar
              </Badge>
              <TrendingUp className="size-6 text-muted-foreground" />
              <p className="mt-2.5 text-sm font-medium">Sales</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Leads &amp; Abschlüsse
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
