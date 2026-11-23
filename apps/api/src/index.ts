import { Hono } from "hono";
import { cors } from "hono/cors";
import { employeesRoute } from "./routes/employees";
import { shiftsRoute } from "./routes/shifts";
import { templatesRoute } from "./routes/templates";

const app = new Hono()
  .use("*", cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" }))
  .get("/health", (c) => c.json({ ok: true }))
  .route("/employees", employeesRoute)
  .route("/templates", templatesRoute)
  .route("/shifts", shiftsRoute);

export type AppType = typeof app;

export default {
  port: Number(process.env.PORT ?? 3001),
  fetch: app.fetch,
};
