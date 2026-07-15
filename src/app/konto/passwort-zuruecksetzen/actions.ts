"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password !== confirm) {
    redirect("/konto/passwort-zuruecksetzen?error=Passwörter+stimmen+nicht+überein");
  }

  if (password.length < 8) {
    redirect("/konto/passwort-zuruecksetzen?error=Passwort+muss+mindestens+8+Zeichen+lang+sein");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/konto/passwort-zuruecksetzen?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/konto?info=Passwort+wurde+erfolgreich+geändert");
}
