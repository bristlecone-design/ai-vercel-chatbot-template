import { unstable_expireTag as expireTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

import { getErrorMessage } from '@/lib/errors';

// export const runtime = 'edge';

export { handler as POST };

type PostParams = {
  tags: string | string[];
};

/**
 * Handles resetting a chat's cache, both /chat/ and /share/ paths
 */
const handler = async (request: NextRequest) => {
  try {
    const { tags } = (await request.json()) as PostParams;

    const list = Array.isArray(tags) ? tags : [tags];

    if (!tags || list.length === 0) {
      throw new Error('No tags provided to reset cache');
    }

    for (const t of list) {
      expireTag(t);
    }

    return NextResponse.json({
      cacheCleared: true,
      tags: list,
    });
  } catch (error) {
    console.log('Error clearing cache for tags: ', error);
    const errMsg = getErrorMessage(error);
    return new Response(`Erro clearing cache for tags: ${errMsg}`, {
      status: 500,
      statusText: errMsg,
    });
  }
};
