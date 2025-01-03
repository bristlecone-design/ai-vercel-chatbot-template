import { config } from 'dotenv';
import { type Config, defineConfig } from 'drizzle-kit';

config({
  path: '.env',
});

// https://orm.drizzle.team/docs/drizzle-config-file#schema
export default defineConfig({
  schema: './lib/db/schemas/schema-*.ts',
  // driver: 'pglite',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
}) satisfies Config;
