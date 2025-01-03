import type { ApplicationError } from './errors';

export default async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<JSON> {
  const res = await fetch(input, init);

  if (!res.ok) {
    // Account for user not logged in or session expiration
    if (res.status === 401) {
      throw new Error('Unauthorized');
    }

    const json = await res.json();

    if (json.error) {
      const error = new Error(json.error) as ApplicationError;

      error.info = await res.json();
      error.status = res.status;
      throw error;
    } else {
      throw new Error('An unexpected error occurred');
    }
  }

  return res.json();
}
