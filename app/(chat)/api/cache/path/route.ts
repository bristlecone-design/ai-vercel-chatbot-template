import { unstable_expirePath as expirePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

import { getErrorMessage } from '@/lib/errors';

// export const runtime = 'edge';

export { handler as POST };

type PostParams = {
  paths: string | string[];
};

/**
 * Handles resetting a page path, e.g. /profile/edit
 */
const handler = async (request: NextRequest) => {
  try {
    const { paths } = (await request.json()) as PostParams;

    const list = Array.isArray(paths) ? paths : [paths];

    if (!paths || list.length === 0) {
      throw new Error('No paths provided to reset cache');
    }

    for (const t of list) {
      expirePath(t);
    }

    return NextResponse.json({
      cacheCleared: true,
      paths: list,
    });
  } catch (error) {
    console.log('Error clearing cache for paths: ', error);
    const errMsg = getErrorMessage(error);
    return new Response(`Error clearing cache for paths: ${errMsg}`, {
      status: 500,
      statusText: errMsg,
    });
  }
};
