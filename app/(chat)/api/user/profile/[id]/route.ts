// import { getCachedUserProfileDb } from '@/actions/user-db';
import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import type { USER_MODEL } from '@/types/user';

// https://beta.nextjs.org/docs/routing/route-handlers

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#runtime
// export const runtime = 'nodejs';

// Revalidate every x minutes
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#revalidate
// export const revalidate = 0;

export { postHandler as POST };

type UserSaveParamTypes = {
  userId: USER_MODEL['id'];
  //   keysToOmit?: Array<keyof Prisma.UserOmit>;
};

// https://beta.nextjs.org/docs/routing/route-handlers#dynamic-route-handlers
const postHandler = async (
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) => {
  const body = await request.json();
  const params = await props.params;
  const userId = params.id;

  //   let keysToOmit: UserSaveParamTypes['keysToOmit'] | undefined;

  // Data from POST
  //   const { keysToOmit: keysToOmitProp } = body as UserSaveParamTypes;

  //   if (keysToOmitProp) {
  //     keysToOmit = keysToOmitProp;
  //   }

  if (!userId) {
    const statusText = 'User ID not provided';
    return new Response(statusText, {
      status: StatusCodes.BAD_REQUEST,
      statusText,
    });
  }

  //   const user = await getCachedUserProfileDb(userId, keysToOmit);

  // 2. All done!
  return NextResponse.json({
    // user,
  });
};
