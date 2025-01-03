import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

// biome-ignore lint: Forbidden non-null assertion.
const pool = new Pool({ connectionString: process.env.POSTGRES_URL! });
export const db = drizzle(pool);
