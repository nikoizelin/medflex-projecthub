import { Mail, Shield, Moon, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/current-user";
import { signOut } from "@/lib/auth-actions";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function KontoPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div>
      <h1 className="mb-3.5 text-lg font-semibold">Benutzerkonto</h1>
      <div className="max-w-80 rounded-lg border bg-background p-3.5">
        <div className="mb-3.5 flex items-center gap-3">
          <Avatar className="size-11">
            <AvatarFallback className="font-medium">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{user.role}</p>
          </div>
        </div>

        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="py-1 text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-4" /> E-Mail
                </span>
              </td>
              <td className="py-1 text-right">{user.email}</td>
            </tr>
            <tr>
              <td className="py-1 text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="size-4" /> Rolle
                </span>
              </td>
              <td className="py-1 text-right">{user.role}</td>
            </tr>
          </tbody>
        </table>

        <form action={signOut} className="mt-3.5">
          <Button type="submit" variant="outline" className="w-full">
            <LogOut className="size-4" />
            Abmelden
          </Button>
        </form>
      </div>
    </div>
  );
}
