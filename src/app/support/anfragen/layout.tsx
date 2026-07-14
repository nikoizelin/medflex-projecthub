import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar title="Support" userName={user.name} />
        <main className="flex-1 p-5">{children}</main>
      </div>
    </div>
  );
}
