# Medflex ProjektHub

Modulare Projektmanagement-Plattform der Medflex Schweiz AG.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Prisma ORM + PostgreSQL (Supabase)
- Supabase Auth (E-Mail/Passwort + Google OAuth)

## Setup

1. Abhängigkeiten installieren:

   ```bash
   npm install
   ```

2. `.env` ausfüllen (Werte aus dem Supabase-Projekt, Project Settings → API
   bzw. Database):

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   DATABASE_URL=        # Pooled connection, Port 6543
   DIRECT_URL=          # Direkte Verbindung, Port 5432 (für Migrationen)
   ```

3. In Supabase: Google OAuth Provider aktivieren (Authentication → Providers)
   und Redirect-URL `http://localhost:3000/auth/callback` (bzw. die
   Produktions-URL) hinterlegen.

4. Datenbankschema anlegen + Beispieldaten einspielen:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Dev-Server starten:

   ```bash
   npm run dev
   ```

## Modul "Projektplanung"

- **Übersicht** (`/projektplanung/uebersicht`) – Projektliste, Suche, Status-Filter,
  Projekt anlegen
- **Projektdetail** (`/projektplanung/projekte/[id]`) – Zeitplan berechnen
  (Werktage Mo–Fr, Sa/So werden übersprungen), Timeline, Checkliste (34 Punkte)
- **Zeitplan** (`/projektplanung/zeitplan`) – Gantt-artige Übersicht der
  22 Schedule-Schritte je Projekt
- **Kalender** (`/projektplanung/kalender`) – Monatsansicht (nur Mo–Fr),
  Projekt-Filter, "+N weitere"-Popup bei Überlappung
- **Benutzerkonto** (`/projektplanung/konto`) – Profil, Logout

Die Schedule-Engine (22-Schritte-Ablauf, Werktagsberechnung, Checklisten-/
Timeline-Logik) liegt in [`src/lib/schedule.ts`](src/lib/schedule.ts) und wird
sowohl vom Seed-Script als auch von den Server Actions
([`src/app/projektplanung/actions.ts`](src/app/projektplanung/actions.ts))
verwendet.
