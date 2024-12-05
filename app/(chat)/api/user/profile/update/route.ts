import { updateUserDb } from '@/actions/user-db';
import { updateUser } from '@/actions/user-kv';
import type { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import type { USER_MODEL } from '@/types/user';

// https://beta.nextjs.org/docs/routing/route-handlers

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#runtime
// export const runtime = 'edge';

export { handler as POST };

type UserSaveParamTypes = {
  userId: USER_MODEL['id'];
  data?: Partial<Prisma.UserUpdateInput>;
};

// https://beta.nextjs.org/docs/routing/route-handlers#dynamic-route-handlers
const handler = async (request: NextRequest) => {
  // Data from POST
  const { userId, ...rest } = (await request.json()) as UserSaveParamTypes;

  const updatePayload = rest as UserSaveParamTypes['data'];

  // console.log(`userId in b/e api`, userId);
  // console.log(`data in b/e api`, data);

  if (!userId) {
    const statusText = 'User ID not provided';
    return new Response(statusText, {
      status: StatusCodes.BAD_REQUEST,
      statusText,
    });
  }

  // If data is empty
  if (!updatePayload || !Object.keys(updatePayload).length) {
    const statusText = 'No user profile data provided';
    return new Response(statusText, {
      status: StatusCodes.BAD_REQUEST,
      statusText,
    });
  }

  const kvUpdateRes = await updateUser(userId, updatePayload as any);
  const updateRes = await updateUserDb(userId, updatePayload);
  console.log(`updateRes in b/e api`, updateRes);

  // 2. All done!
  return NextResponse.json({
    updated: updateRes.updated,
    payload: updatePayload,
  });
};
