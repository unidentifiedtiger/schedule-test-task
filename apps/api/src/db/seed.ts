import { count } from "drizzle-orm";
import { db } from "./client";
import { employees, shiftTemplates, shifts } from "./schema";

const names = [
  "Кузнецова Алина",
  "Волков Тимур",
  "Морозова Виктория",
  "Соколов Артём",
  "Лебедева Полина",
  "Новиков Кирилл",
  "Ерохина Дарья",
  "Гаврилов Егор",
];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Wipes everything and inserts the demo data. */
export async function seedDatabase() {
  await db.delete(shifts);
  await db.delete(employees);
  await db.delete(shiftTemplates);

  const templates = await db
    .insert(shiftTemplates)
    .values([
      { name: "Утро", startTime: "07:00", endTime: "15:00", color: "blue" },
      { name: "День", startTime: "10:00", endTime: "18:00", color: "purple" },
      { name: "Вечер", startTime: "15:00", endTime: "23:00", color: "teal" },
    ])
    .returning();

  const created = await db
    .insert(employees)
    .values(names.map((fullName) => ({ fullName, position: "агент", hoursNorm: 24 })))
    .returning({ id: employees.id });

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);

  const rows: (typeof shifts.$inferInsert)[] = [];
  let day = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1), day++) {
    created.forEach((emp, idx) => {
      const k = (day + idx) % 4;
      if (k === 3) return; // day off
      const t = templates[(idx + k) % 3];
      rows.push({
        employeeId: emp.id,
        date: iso(d),
        startTime: t.startTime,
        endTime: t.endTime,
        templateId: t.id,
      });
    });
  }
  await db.insert(shifts).values(rows);

  console.log(`Seeded ${templates.length} templates, ${created.length} employees, ${rows.length} shifts`);
}

/** Seeds only when there are no employees yet, so it is safe on every start. */
export async function seedIfEmpty() {
  const [{ value }] = await db.select({ value: count() }).from(employees);
  if (value > 0) {
    console.log("Database already has data, skipping seed");
    return;
  }
  await seedDatabase();
}

// `bun src/db/seed.ts` still wipes and reseeds; add --if-empty to keep existing data
if (import.meta.main) {
  if (process.argv.includes("--if-empty")) await seedIfEmpty();
  else await seedDatabase();
  process.exit(0);
}