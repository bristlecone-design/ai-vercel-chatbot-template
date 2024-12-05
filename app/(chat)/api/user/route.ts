// import { getUser } from '@/actions/user-kv';
// import { StatusCodes } from 'http-status-codes';
// import { type NextRequest, NextResponse } from 'next/server';

// import type { USER_MODEL } from '@/types/user';

// // https://beta.nextjs.org/docs/routing/route-handlers

// // https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#runtime
// // export const runtime = 'edge';

// export { handler as POST };

// type UserSaveParamTypes = {
//   userId: USER_MODEL['id'];
// };

// // https://beta.nextjs.org/docs/routing/route-handlers#dynamic-route-handlers
// const handler = async (request: NextRequest) => {
//   let userId: UserSaveParamTypes['userId'] | undefined;

//   // Data from POST
//   ({ userId } = await request.json()) as UserSaveParamTypes;

//   if (!userId) {
//     const statusText = 'User ID not provided';
//     return new Response(statusText, {
//       status: StatusCodes.BAD_REQUEST,
//       statusText,
//     });
//   }

//   const user = await getUser(userId);

//   // 2. All done!
//   return NextResponse.json({
//     user,
//   });
// };
