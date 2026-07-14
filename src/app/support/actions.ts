"use server";

import { prisma } from "@/lib/prisma";

export interface ChangeRequestEntry {
  kontaktperson: string;
  praxisKunde: string;
  datum: string;
  prioritaet: string;
  beschreibungProblem: string;
  linkAnfrage: string;
  fehlerhaftesVerhalten: string;
  erwartesVerhalten: string;
}

export async function submitChangeRequests(entries: ChangeRequestEntry[]) {
  if (!entries.length) return;

  await prisma.changeRequest.createMany({
    data: entries.map((e) => ({
      kontaktperson: e.kontaktperson.trim(),
      praxisKunde: e.praxisKunde.trim(),
      datum: new Date(e.datum),
      prioritaet: e.prioritaet,
      beschreibungProblem: e.beschreibungProblem.trim(),
      linkAnfrage: e.linkAnfrage.trim(),
      fehlerhaftesVerhalten: e.fehlerhaftesVerhalten.trim(),
      erwartesVerhalten: e.erwartesVerhalten.trim(),
    })),
  });
}
