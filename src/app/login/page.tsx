import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPassword } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; info?: string }>;
}) {
  const { error, info } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-lg border bg-background p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center">
                      <img src="/favicon.png" alt="MedFlex Logo" className="size-full" />
          </div>
          <div>
            <p className="text-sm font-medium leading-none">MedFlex</p>
            <p className="text-xs text-muted-foreground">ProjektHub</p>
          </div>
        </div>

        <h1 className="mb-1 text-lg font-semibold">Anmelden</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Willkommen zurück. Bitte melde dich mit deinem Konto an.
        </p>

        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {info && (
          <p className="mb-4 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
            {info}
          </p>
        )}

        <form action={signInWithPassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@medflex-schweiz.ch"
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Passwort</Label>
              <Link
                href="/login/passwort-vergessen"
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Passwort vergessen?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="mt-2 w-full">
            Anmelden
          </Button>
        </form>
      </div>
    </div>
  );
}
