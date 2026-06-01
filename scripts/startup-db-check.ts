/**
 * Startup database probe — run before `next start` or in Docker entrypoint.
 */
import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString, max: 1 });
  try {
    await pool.query("SELECT 1");
    console.log("Database connection OK");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Startup database check failed:", error);
  process.exit(1);
});
