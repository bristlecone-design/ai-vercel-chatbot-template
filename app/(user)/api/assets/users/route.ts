import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import {
  getAllUsersFeaturedImgs,
  getCachedAllUsersFeaturedImgs,
} from '@/lib/db/queries/media/get-featured-imgs';
import { getErrorMessage } from '@/lib/errors';

// export const runtime = 'edge';

export { getHandler as GET, postHandler as POST };

type PostParams = {
  cached?: boolean;
};

/**
 * Handles adding assets to a user's list of featured assets
 */
const postHandler = async (request: NextRequest) => {
  const { cached = false } = (await request.json()) as PostParams;
  try {
    const allFeaturedImgs = await (cached
      ? getCachedAllUsersFeaturedImgs()
      : getAllUsersFeaturedImgs());

    return NextResponse.json({ images: allFeaturedImgs });
  } catch (error) {
    const errMsg = getErrorMessage(error);
    const baseErrMsg = 'Failed to get all user featured assets';
    console.log(baseErrMsg, error);
    return new Response(`${baseErrMsg}: ${errMsg}`, {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      statusText: errMsg,
    });
  }
};

const getHandler = async (request: NextRequest) => {
  const cached = request.nextUrl.searchParams.get('cached') === 'true';

  try {
    const allFeaturedImgs = await (cached
      ? getCachedAllUsersFeaturedImgs()
      : getAllUsersFeaturedImgs());

    return NextResponse.json({ images: allFeaturedImgs });
  } catch (error) {
    const errMsg = getErrorMessage(error);
    const baseErrMsg = 'Failed to get all user featured assets';
    console.log(baseErrMsg, error);
    return new Response(`${baseErrMsg}: ${errMsg}`, {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      statusText: errMsg,
    });
  }
};
