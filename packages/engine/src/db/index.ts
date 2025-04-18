import 'dotenv/config'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL as string

export const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema: schema });
