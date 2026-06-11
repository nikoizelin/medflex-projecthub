"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  ListChecks,
  Clock,
  Calendar,
  User,
} from "lucide-react";

const projektplanungNav = [
  { href: "/projektplanung/uebersicht", label: "Übersicht", icon: ListChecks },
  { href: "/projektplanung/zeitplan", label: "Zeitplan", icon: Clock },
  { href: "/projektplanung/kalender", label: "Kalender", icon: Calendar },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-46 shrink-0 flex-col gap-0.5 border-r bg-muted/30 p-2.5">
      <div className="flex items-center gap-2 px-2 pb-4 pt-1">
        <div className="flex size-7 items-center justify-center">
          <img src="/favicon.png" alt="MedFlex Logo" className="size-full" />
        </div>
        <div>
          <p className="text-sm font-medium leading-none">MedFlex</p>
          <p className="text-xs text-muted-foreground">ProjektHub</p>
        </div>
      </div>

      <NavLink href="/dashboard" label="Module" icon={LayoutGrid} active={pathname === "/dashboard"} />

      <p className="mb-1 mt-3 px-2 text-xs text-muted-foreground">Projektplanung</p>
      {projektplanungNav.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={pathname.startsWith(item.href)}
        />
      ))}
    </aside>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground",
        active && "border bg-background font-medium text-foreground"
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
