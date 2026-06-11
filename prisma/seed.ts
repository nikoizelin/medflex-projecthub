import { PrismaClient } from "../src/generated/prisma";
import {
  PALETTE,
  baseChecklist,
  calculateSchedule,
  computeDeadline,
} from "../src/lib/schedule";

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function makeChecklist(checkedCount: number) {
  return baseChecklist.map((label, i) => ({
    label,
    checked: i < checkedCount,
    order: i,
  }));
}

async function main() {
  const lisa = await prisma.user.upsert({
    where: { email: "l.meier@medflex.ch" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      email: "l.meier@medflex.ch",
      name: "Lisa Meier",
      role: "Manager",
    },
  });

  const tom = await prisma.user.upsert({
    where: { email: "t.keller@medflex.ch" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      email: "t.keller@medflex.ch",
      name: "Tom Keller",
      role: "Manager",
    },
  });

  const projectsData = [
    {
      name: "Praxis Sonnenberg",
      status: "LAUFEND" as const,
      ownerId: lisa.id,
      color: PALETTE[0],
      startDate: daysAgo(35),
      checkedCount: 22,
    },
    {
      name: "Zahnklinik Nordpark",
      status: "LAUFEND" as const,
      ownerId: tom.id,
      color: PALETTE[1],
      startDate: daysAgo(60),
      checkedCount: 14,
    },
    {
      name: "Reha Zentrum Aare",
      status: "ABGESCHLOSSEN" as const,
      ownerId: lisa.id,
      color: PALETTE[2],
      startDate: daysAgo(160),
      checkedCount: 32,
    },
    {
      name: "Klinik Lindenhof",
      status: "LAUFEND" as const,
      ownerId: tom.id,
      color: PALETTE[3],
      startDate: null,
      checkedCount: 0,
    },
  ];

  for (const p of projectsData) {
    const existing = await prisma.project.findFirst({ where: { name: p.name } });
    if (existing) {
      console.log(`Projekt "${p.name}" existiert bereits, überspringe.`);
      continue;
    }

    const calculated = p.startDate !== null;
    let stepsCreate: { name: string; order: number; startDate: Date; endDate: Date }[] = [];
    let deadline: Date | null = null;

    if (calculated && p.startDate) {
      const computed = calculateSchedule(p.startDate);
      stepsCreate = computed.map((s) => ({
        name: s.name,
        order: s.order,
        startDate: s.start,
        endDate: s.end,
      }));
      deadline = computeDeadline(computed);
    }

    await prisma.project.create({
      data: {
        name: p.name,
        status: p.status,
        color: p.color,
        ownerId: p.ownerId,
        startDate: p.startDate,
        deadline,
        calculated,
        steps: { create: stepsCreate },
        checklist: { create: makeChecklist(p.checkedCount) },
      },
    });
    console.log(`Projekt "${p.name}" angelegt.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
