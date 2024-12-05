import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Rate Limits
 *
 * @see https://upstash.com/docs/oss/sdks/ts/ratelimit/overview
 * @see https://upstash.com/docs/oss/sdks/ts/ratelimit/features#using-multiple-limits
 */

const expNvRatelimits = {
  base: new Ratelimit({
    redis: kv,
    // 60 requests per minute
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: true,
    prefix: 'exp_nv_ratelimit',
  }),

  passwordResets: new Ratelimit({
    redis: kv,
    // 1 request per hour
    limiter: Ratelimit.slidingWindow(1, '1h'),
    analytics: true,
    prefix: 'exp_nv_ratelimit_password_resets',
  }),
};

async function getIP() {
  return (await headers()).get('x-real-ip') ?? 'unknown';
}

export async function baseRateLimit(redirectPath = '') {
  const userIp = await getIP();
  const limit = await expNvRatelimits.base.limit(userIp);
  if (!limit.success && redirectPath) {
    redirect(redirectPath);
  }

  return limit;
}

export async function passwordResetsRateLimit(redirectPath = '') {
  const userIp = await getIP();
  const limit = await expNvRatelimits.passwordResets.limit(userIp);
  if (!limit.success && redirectPath) {
    redirect(redirectPath);
  }

  return limit;
}
