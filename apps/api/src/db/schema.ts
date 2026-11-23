import type { TemplateColor } from "@app/shared";
import { date, index, integer, pgTable, text, time, unique } from "drizzle-orm/pg-core";

export const employees = pgTable("employees", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fullName: text("full_name").notNull(),
  position: text("position").notNull(),
  hoursNorm: integer("hours_norm").notNull(),
  avatarUrl: text("avatar_url"),
});

export const shiftTemplates = pgTable("shift_templates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  color: text("color").$type<TemplateColor>().notNull(),
});

export const shifts = pgTable(
  "shifts",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    // null = custom shift (times are stored on the shift itself either way)
    templateId: integer("template_id").references(() => shiftTemplates.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    unique("shifts_employee_date_unique").on(t.employeeId, t.date),
    index("shifts_date_idx").on(t.date),
  ],
);
