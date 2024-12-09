import {
  getCachedUserWaitlistCount,
  getUserWaitlistCount,
} from '@/actions/user';
import { type NextRequest, NextResponse } from 'next/server';

// https://beta.nextjs.org/docs/routing/route-handlers

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#runtime
export const runtime = 'edge';

export { getHandler as GET, postHandler as POST };

type PostParams = {
  cached?: boolean;
};

// https://beta.nextjs.org/docs/routing/route-handlers#dynamic-route-handlers
const postHandler = async (request: NextRequest) => {
  const { cached = false } = (await request.json()) as PostParams;
  const count = await (cached
    ? getCachedUserWaitlistCount()
    : getUserWaitlistCount());

  return NextResponse.json({
    count,
    cached,
  });
};

const getHandler = async (request: NextRequest) => {
  const cached = request.nextUrl.searchParams.get('cached') === 'true';

  const count = await (cached
    ? getCachedUserWaitlistCount()
    : getUserWaitlistCount());

  return NextResponse.json({
    count,
    cached,
  });
};
