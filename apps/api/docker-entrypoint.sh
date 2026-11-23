#!/bin/sh
set -e

bun src/db/migrate.ts

if [ "$SEED_ON_START" = "true" ]; then
  bun src/db/seed.ts --if-empty
fi

exec bun src/index.ts