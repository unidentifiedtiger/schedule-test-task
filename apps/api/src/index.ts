import { Hono } from "hono";
import { cors } from "hono/cors";
import { prepareDatabase } from "./db/bootstrap";
import { employeesRoute } from "./routes/employees";
import { shiftsRoute } from "./routes/shifts";
import { templatesRoute } from "./routes/templates";

// Create the tables (and optionally seed) before accepting requests
await prepareDatabase();

const app = new Hono()
  .use("*", cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" }))
  .get("/health", (c) => c.json({ ok: true }))
  .route("/employees", employeesRoute)
  .route("/templates", templatesRoute)
  .route("/shifts", shiftsRoute);

export type AppType = typeof app;

const port = Number(process.env.PORT ?? 3001);
console.log(`API listening on port ${port}`);

export default { port, fetch: app.fetch };