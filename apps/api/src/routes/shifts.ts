import { assignBody, clearBody, dateRangeQuery, moveBody } from "@app/shared";
import { zValidator } from "@hono/zod-validator";
import { and, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { db } from "../db/client";
import { employees, shiftTemplates, shifts } from "../db/schema";

// Postgres returns "HH:MM:SS"; the UI works with "HH:MM"
const toDto = (s: typeof shifts.$inferSelect) => ({
  ...s,
  startTime: s.startTime.slice(0, 5),
  endTime: s.endTime.slice(0, 5),
});

export const shiftsRoute = new Hono()
  .get("/", zValidator("query", dateRangeQuery), async (c) => {
    const { from, to } = c.req.valid("query");
    const rows = await db
      .select()
      .from(shifts)
      .where(and(gte(shifts.date, from), lte(shifts.date, to)));
    return c.json(rows.map(toDto));
  })

  // Create or replace shifts for any set of cells (one cell, a selection, a whole day).
  .put("/", zValidator("json", assignBody), async (c) => {
    const { cells, shift } = c.req.valid("json");

    // The same cell twice in one upsert would make Postgres fail.
    const unique = [...new Map(cells.map((x) => [`${x.employeeId}:${x.date}`, x])).values()];

    const ids = [...new Set(unique.map((x) => x.employeeId))];
    const found = await db
      .select({ id: employees.id })
      .from(employees)
      .where(inArray(employees.id, ids));
    if (found.length !== ids.length) throw new HTTPException(400, { message: "Unknown employee" });

    let templateId: number | null = null;
    let startTime: string;
    let endTime: string;
    if ("templateId" in shift) {
      const [t] = await db
        .select()
        .from(shiftTemplates)
        .where(eq(shiftTemplates.id, shift.templateId));
      if (!t) throw new HTTPException(404, { message: "Unknown template" });
      templateId = t.id;
      startTime = t.startTime;
      endTime = t.endTime;
    } else {
      startTime = shift.startTime;
      endTime = shift.endTime;
    }

    const rows = await db
      .insert(shifts)
      .values(
        unique.map((x) => ({
          employeeId: x.employeeId,
          date: x.date,
          startTime,
          endTime,
          templateId,
        })),
      )
      .onConflictDoUpdate({
        target: [shifts.employeeId, shifts.date],
        set: {
          startTime: sql`excluded.start_time`,
          endTime: sql`excluded.end_time`,
          templateId: sql`excluded.template_id`,
        },
      })
      .returning();

    return c.json(rows.map(toDto));
  })

  .post("/clear", zValidator("json", clearBody), async (c) => {
    const { cells } = c.req.valid("json");
    const deleted = await db
      .delete(shifts)
      .where(
        or(...cells.map((x) => and(eq(shifts.employeeId, x.employeeId), eq(shifts.date, x.date)))),
      )
      .returning({ id: shifts.id });
    return c.json({ deleted: deleted.length });
  })

  // Drag-and-drop: move a shift to another cell (or copy it). One transaction, so a shift
  // is never lost or duplicated halfway. An existing shift in the target cell is replaced.
  .post("/move", zValidator("json", moveBody), async (c) => {
    const { from, to, copy } = c.req.valid("json");
    if (from.employeeId === to.employeeId && from.date === to.date) {
      throw new HTTPException(400, { message: "Source and target are the same cell" });
    }

    const row = await db.transaction(async (tx) => {
      const [source] = await tx
        .select()
        .from(shifts)
        .where(and(eq(shifts.employeeId, from.employeeId), eq(shifts.date, from.date)));
      if (!source) throw new HTTPException(404, { message: "No shift in the source cell" });

      const [employee] = await tx
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.id, to.employeeId));
      if (!employee) throw new HTTPException(400, { message: "Unknown employee" });

      const [created] = await tx
        .insert(shifts)
        .values({
          employeeId: to.employeeId,
          date: to.date,
          startTime: source.startTime,
          endTime: source.endTime,
          templateId: source.templateId,
        })
        .onConflictDoUpdate({
          target: [shifts.employeeId, shifts.date],
          set: {
            startTime: sql`excluded.start_time`,
            endTime: sql`excluded.end_time`,
            templateId: sql`excluded.template_id`,
          },
        })
        .returning();

      if (!copy) await tx.delete(shifts).where(eq(shifts.id, source.id));
      return created;
    });

    return c.json(toDto(row));
  });
