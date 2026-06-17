import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { getCurrentUser } from "@/lib/current-user";

export default async function TicketsystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar title="Ticketsystem" userName={user.name} />
        <main className="flex-1 p-5">{children}</main>
      </div>
    </div>
  );
}
