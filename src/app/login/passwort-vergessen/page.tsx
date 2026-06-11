import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "../actions";

export default function PasswordResetPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-lg border bg-background p-8 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold">Passwort vergessen</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Gib deine E-Mail-Adresse ein, um einen Link zum Zurücksetzen deines
          Passworts zu erhalten.
        </p>

        <form action={requestPasswordReset} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@medflex.ch"
              required
              autoComplete="email"
            />
          </div>
          <Button type="submit" className="mt-2 w-full">
            Link senden
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    </div>
  );
}
