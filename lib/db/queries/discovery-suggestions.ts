import { db } from '@/lib/db/connect';
import { type DiscoverySuggestion, discoverySuggestion } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import 'server-only';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// const client = postgres(process.env.POSTGRES_URL!);
// const db = drizzle(client);

/**
 * Get all discovery suggestions, unique by title
 */
export async function getAllDiscoverySuggestions() {
  try {
    return await db
      .selectDistinct()
      .from(discoverySuggestion)
      .where(eq(discoverySuggestion.type, 'discover'));
  } catch (error) {
    console.error('Failed to get all discovery suggestions from db');
    throw error;
  }
}

/**
 * Get all experience suggestions, unique by title
 *
 */
export async function getAllExperienceSuggestions() {
  try {
    return await db
      .selectDistinct()
      .from(discoverySuggestion)
      .where(eq(discoverySuggestion.type, 'experience'));
  } catch (error) {
    console.error('Failed to get all experience suggestions from db');
    throw error;
  }
}

/**
 * Get discovery suggestions by title and userId
 */
export async function getDiscoverySuggestionsByTitleAndUserId({
  title,
  userId,
}: {
  title: string;
  userId: string;
}) {
  try {
    return await db
      .select()
      .from(discoverySuggestion)
      .where(
        and(
          eq(discoverySuggestion.title, title),
          eq(discoverySuggestion.userId, userId),
        ),
      );
  } catch (error) {
    console.error(
      'Failed to get discovery suggestions by title and user from database',
    );
    throw error;
  }
}

/**
 * Get discovery suggestions solely by userId
 */
export async function getDiscoverySuggestionsByUserId({
  userId,
}: {
  userId: string;
}) {
  try {
    return await db
      .select()
      .from(discoverySuggestion)
      .where(eq(discoverySuggestion.userId, userId));
  } catch (error) {
    console.error('Failed to get discovery suggestions by user from database');
    throw error;
  }
}

/**
 * Save discovery suggestions
 */
export async function saveDiscoverySuggestions({
  suggestions,
}: {
  suggestions: Array<DiscoverySuggestion>;
}) {
  try {
    return await db.insert(discoverySuggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save discovery suggestions in database');
    throw error;
  }
}
