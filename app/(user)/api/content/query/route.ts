import { retrieveRelevantContent } from '@/actions/resource';
import { getErrorMessage } from '@/lib/errors';
import { getUserFromSession } from '@/lib/session';
// import { getUserProfileDb } from '@/actions/user-db';
import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Retrieve relevant content based on user query
 *
 * @note Leverages embeddings to find similar content
 * @see /api/content for creation of content embeddings
 */

type POST_PARAMS = {
  query: string;
  score?: number;
  limit?: number;
  bypassAuth?: boolean;
};

export { handler as POST };

const handler = async (request: NextRequest) => {
  const body = (await request.json()) as POST_PARAMS;
  const { limit, score, query: userQuery, bypassAuth = false } = body;

  if (!userQuery) {
    return new Response('No query provided', {
      status: StatusCodes.BAD_REQUEST,
    });
  }

  let user;
  if (!bypassAuth) {
    user = await getUserFromSession();
    if (!user) {
      return new Response('User not authenticated', {
        status: StatusCodes.BAD_REQUEST,
      });
    }
  }

  try {
    const response = await retrieveRelevantContent(userQuery, score, limit);

    return NextResponse.json(response);
  } catch (error) {
    const errMsg = getErrorMessage(error);
    return new Response(errMsg, {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};
