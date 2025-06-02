import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";

// Configure for serverless environment
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is missing");
  throw new Error(
    "DATABASE_URL must be set. Please configure your database connection in Vercel environment variables.",
  );
}

// Configure connection pool for serverless
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
  max: 1, // Limit connections for serverless
});

export const db = drizzle({ client: pool, schema });