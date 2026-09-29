import dotenv from "dotenv";
if (!process.env.DB_HOST) {
  dotenv.config({ path: [`.env.${process.env.NODE_ENV || "dev"}`, ".env"] });
}
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getDatabaseSslConfig } from "./ssl";

const ssl = getDatabaseSslConfig();

const poolConnection = postgres({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl,
  // ssl: { rejectUnauthorized: false },
});
export const db = drizzle(poolConnection, { schema });

async function main() {
  try {
    const connection = postgres({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
      ssl,
    });
    await connection`SELECT NOW()`;
    console.log(
      `Server connecting to DB at: ${process.env.DB_HOST} as user: ${process.env.DB_USER} :)`,
    );
    await connection.end(); // Close the connection
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

// Export cleanup function for tests
export async function closeDbConnection() {
  await poolConnection.end();
}

// Only run main() if not in test environment
if (process.env.NODE_ENV !== "test") {
  main();
}
