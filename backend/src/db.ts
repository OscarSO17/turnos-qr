import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("Falta la variable DATABASE_URL en el archivo .env");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});