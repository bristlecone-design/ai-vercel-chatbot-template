import { makeUrlAbsolute, shortenUrl } from './urls';

const VERCEL_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV;
const VERCEL_PRODUCTION_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const VERCEL_DEPLOYMENT_URL = process.env.NEXT_PUBLIC_VERCEL_URL;
const VERCEL_BRANCH_URL = process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL;
const VERCEL_BRANCH = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF;
// Last resort: cannot be used reliably
const VERCEL_PROJECT_URL =
  VERCEL_BRANCH_URL && VERCEL_BRANCH
    ? `${VERCEL_BRANCH_URL.split(`-git-${VERCEL_BRANCH}-`)[0]}.vercel.app`
    : undefined;

export const IS_PRODUCTION =
  process.env.NODE_ENV === 'production' &&
  // Make environment checks resilient to non-Vercel deployments
  (VERCEL_ENV === 'production' || !VERCEL_ENV);

export const IS_LOCAL_DEVELOPMENT = !IS_PRODUCTION;

// User-facing domain, potential site title
export const SITE_DOMAIN =
  process.env.NEXT_PUBLIC_APP_URL ||
  VERCEL_PRODUCTION_URL ||
  VERCEL_PROJECT_URL ||
  VERCEL_DEPLOYMENT_URL;

const SITE_DOMAIN_SHORT = shortenUrl(SITE_DOMAIN);

export const SITE_DOMAIN_OR_TITLE = SITE_DOMAIN_SHORT || SITE_TITLE;

export const BASE_URL = makeUrlAbsolute(
  process.env.NODE_ENV === 'production' && VERCEL_ENV !== 'preview'
    ? SITE_DOMAIN
    : VERCEL_ENV === 'preview'
      ? VERCEL_BRANCH_URL || VERCEL_DEPLOYMENT_URL
      : `http://localhost:${process.env.PORT ?? 3000}`,
)?.toLocaleLowerCase();

/**
 * Returns the base URL of the app for use in server-side and client-side code (e.g. API routes, etc.)
 */
export const getBaseUrl = (overrideBaseUrl?: string) =>
  overrideBaseUrl || BASE_URL;
