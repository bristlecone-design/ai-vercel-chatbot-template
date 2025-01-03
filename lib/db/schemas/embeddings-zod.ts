/**
 * Takes some Drizzle schemas and maps them to a set of corresponding zod schemas
 *
 * @note Ideal to colocate all schemas with the Drizzle db schema but there is a bug atm with vector tables @see https://github.com/drizzle-team/drizzle-orm/issues/2424
 */

import { createSelectSchema } from 'drizzle-zod';
import { embeddings } from './schema-embeddings';

export const embeddingsSelectSchema = createSelectSchema(embeddings);
