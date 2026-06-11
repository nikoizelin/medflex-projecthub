import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AppTopbar({
  title,
  userName,
}: {
  title: string;
  userName: string;
}) {
  return (
    <header className="flex items-center gap-3 border-b px-4 py-2.5">
      <p className="flex-1 text-sm font-medium">{title}</p>
      <ThemeToggle />
      <Link href="/projektplanung/konto">
        <Avatar className="size-7 transition-opacity hover:opacity-80">
          <AvatarFallback className="text-xs font-medium">
            {initials(userName)}
          </AvatarFallback>
        </Avatar>
      </Link>
    </header>
  );
}
