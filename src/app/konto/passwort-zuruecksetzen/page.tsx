import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "./actions";

export const metadata = { title: "Passwort ändern – MedFlex" };

export default async function PasswortZuruecksetzenPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; info?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="mb-3.5 text-lg font-semibold">Neues Passwort setzen</h1>
      <div className="max-w-80 rounded-lg border bg-background p-5">
        <p className="mb-4 text-sm text-muted-foreground">
          Wähle ein neues Passwort für dein Konto.
        </p>

        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <form action={updatePassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Neues Passwort</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm">Passwort bestätigen</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="mt-1 w-full">
            Passwort speichern
          </Button>
        </form>
      </div>
    </div>
  );
}
