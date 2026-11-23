import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { seedIfEmpty } from "./seed";

/**
 * Creates the tables and, if asked, seeds demo data. It is opt-in so that local
 * development with `db:push` is never touched:
 *   AUTO_MIGRATE=true   apply the migrations in apps/api/drizzle on start
 *   SEED_ON_START=true  then seed demo data when the database has no employees
 */
export async function prepareDatabase() {
  if (process.env.AUTO_MIGRATE !== "true") return;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: `${import.meta.dir}/../../drizzle` });
  await sql.end();
  console.log("Migrations applied");

  if (process.env.SEED_ON_START === "true") await seedIfEmpty();
}