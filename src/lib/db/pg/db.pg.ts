import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL environment variable is required but not set");
}

export const pgDb = drizzlePg(process.env.POSTGRES_URL);
