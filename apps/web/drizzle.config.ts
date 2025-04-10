import * as dotenv from 'dotenv'
import { defineConfig } from "drizzle-kit";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
})

export default defineConfig({
  out: "./db/drizzle",
  schema: "./db/schema/*",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
});
