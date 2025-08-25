import { defineConfig } from "drizzle-kit";
import "load-env";

const dialect = "postgresql";

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL environment variable is required but not set");
}

const url = process.env.POSTGRES_URL;

const schema = "./src/lib/db/pg/schema.pg.ts";

const out = "./src/lib/db/migrations/pg";

export default defineConfig({
  schema,
  out,
  dialect,
  migrations: {},
  dbCredentials: {
    url,
  },
});
