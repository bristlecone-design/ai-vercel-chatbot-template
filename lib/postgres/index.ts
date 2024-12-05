'use server';

import { Pool, type QueryResult, type QueryResultRow } from 'pg';

import { getErrorMessage } from '../errors';
import { isTemplateStringsArray } from './postgres-utils';

import { POSTGRES_SSL_ENABLED } from '@/config/site-settings';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ...(POSTGRES_SSL_ENABLED && { ssl: true }),
});

export type Primitive = string | number | boolean | undefined | null;

export const query = async <T extends QueryResultRow = any>(
  queryString: string,
  values: Primitive[]
) => {
  const client = await pool.connect();
  let response: QueryResult<T>;
  try {
    response = await client.query<T>(queryString, values);
    return response;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error executing query:', errMsg, queryString, values);
  } finally {
    client.release();
  }
};

export const sql = async <T extends QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: Primitive[]
) => {
  if (!isTemplateStringsArray(strings) || !Array.isArray(values)) {
    throw new Error('Invalid template literal argument');
  }

  let result = strings[0] ?? '';

  for (let i = 1; i < strings.length; i++) {
    result += `$${i}${strings[i] ?? ''}`;
  }

  return query<T>(result, values);
};
