import { employeesQuery } from "@app/shared";
import { zValidator } from "@hono/zod-validator";
import { asc, ilike } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { employees } from "../db/schema";

export const employeesRoute = new Hono().get(
  "/",
  zValidator("query", employeesQuery),
  async (c) => {
    const { search } = c.req.valid("query");
    const rows = await db
      .select()
      .from(employees)
      .where(search ? ilike(employees.fullName, `%${search}%`) : undefined)
      .orderBy(asc(employees.id));
    return c.json(rows);
  },
);
