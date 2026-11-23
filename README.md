# Schedule app

Bun workspaces: `apps/web` (Next.js + Tailwind), `apps/api` (Hono + Drizzle + Postgres), `packages/shared` (Zod schemas).

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
bun install
bun run db:up      # Postgres in Docker
bun run db:push    # create tables
bun run db:seed    # demo employees and shifts
bun run dev        # web: :3000, api: :3001
```
