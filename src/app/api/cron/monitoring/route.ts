import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { getActivePhaseIndex, PHASE_NAMES } from "@/lib/schedule";

const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: {
      status: { in: ["LAUFEND", "ABGESCHLOSSEN"] },
      calculated: true,
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
      status: true,
      checklist: { select: { order: true, checked: true } },
      monitoringAlerts: {
        orderBy: { sentAt: "desc" },
        take: 1,
        select: { sentAt: true },
      },
    },
  });

  const notified: string[] = [];

  for (const p of projects) {
    const phaseIndex = getActivePhaseIndex(p.checklist);
    const phaseLabel = PHASE_NAMES[phaseIndex];

    const isMonitoringPhase = phaseLabel === "Monitoring" || p.status === "ABGESCHLOSSEN";
    if (!isMonitoringPhase) continue;

    const lastAlert = p.monitoringAlerts[0];
    const now = Date.now();
    const lastSentAt = lastAlert ? new Date(lastAlert.sentAt).getTime() : 0;

    if (now - lastSentAt < THREE_WEEKS_MS) continue;

    await prisma.monitoringAlert.create({ data: { projectId: p.id } });

    await createNotification(
      p.ownerId,
      "MONITORING_CHECK",
      `Monitoring-Erinnerung: ${p.name}`,
      `Das Projekt «${p.name}» befindet sich seit über 3 Wochen in der Monitoring-Phase. Bitte prüfen.`,
      `/projektplanung/projekte/${p.id}?tab=monitoring`
    );

    notified.push(p.name);
  }

  return NextResponse.json({ notified, count: notified.length });
}
