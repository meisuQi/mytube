import 'dotenv/config';
import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: ".env.local" });   // 确保加载环境变量

console.log("ENV DATABASE_URL:", process.env.DATABASE_URL);
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in .env.local");
}

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
