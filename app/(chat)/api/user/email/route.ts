// import { getUserByEmail } from '@/actions/user-db';
import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import type { USER_MODEL } from '@/types/user';

// https://beta.nextjs.org/docs/routing/route-handlers

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#runtime
// export const runtime = 'nodejs';

export { handler as GET };

type UserSaveParamTypes = {
  email: USER_MODEL['email'];
};

/**
 * Retrieve a user profile from the database by email
 */
const handler = async (request: NextRequest) => {
  const userEmail = request.nextUrl.searchParams.get(
    'email',
  ) as UserSaveParamTypes['email'];
  console.log(`**** userEmail in api/user/email/route`, userEmail);

  if (!userEmail) {
    const statusText = 'User email not provided';
    return new Response(statusText, {
      status: StatusCodes.BAD_REQUEST,
      statusText,
    });
  }

  const user = {}; // await getUserByEmail(userEmail);

  // 2. All done!
  return NextResponse.json({
    user,
  });
};
