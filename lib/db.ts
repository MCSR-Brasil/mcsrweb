import { createClient, type Client } from "@libsql/client";

let cached: Client | null = null;

export function getDbClient(): Client | null {
  if (cached) return cached;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) return null;
  cached = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return cached;
}
