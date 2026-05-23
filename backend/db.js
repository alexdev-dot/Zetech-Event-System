/**
 * db.js — Postgres pool wrapper
 *
 * Uses `pg` Pool and reads `DATABASE_URL` + optional `DB_SSL` from environment.
 */

import { Pool } from "pg";

let pgPool = null;
if (process.env.DATABASE_URL) {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
}

export const pool = pgPool;

/** Throw an error if the DB can't be reached. */
export async function testConnection() {
  if (pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query("SELECT 1");
    } finally {
      client.release();
    }
    return;
  }

  throw new Error("No DATABASE_URL configured in environment");
}
