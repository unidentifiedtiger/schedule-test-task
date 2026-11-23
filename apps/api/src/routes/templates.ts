import { asc } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { shiftTemplates } from "../db/schema";

export const templatesRoute = new Hono().get("/", async (c) => {
  const rows = await db.select().from(shiftTemplates).orderBy(asc(shiftTemplates.id));
  return c.json(
    rows.map((t) => ({ ...t, startTime: t.startTime.slice(0, 5), endTime: t.endTime.slice(0, 5) })),
  );
});
