// import { NextResponse, type NextRequest } from 'next/server';
// import { getUserAllowedDb } from '@/actions/user-db';
// import { StatusCodes } from 'http-status-codes';

// import type { USER_MODEL } from '@/types/user';

// // https://beta.nextjs.org/docs/routing/route-handlers

// // https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#runtime
// // export const runtime = 'nodejs';

// export { postHandler as POST };

// type UserSaveParamTypes = {
//   userId: USER_MODEL['id'];
// };

// // https://beta.nextjs.org/docs/routing/route-handlers#dynamic-route-handlers
// const postHandler = async (
//   request: NextRequest,
//   { params }: { params: { id: UserSaveParamTypes['userId'] } }
// ) => {
//   const userId = params.id;

//   if (!userId) {
//     const statusText = 'User ID not provided';
//     return new Response(statusText, {
//       status: StatusCodes.BAD_REQUEST,
//       statusText,
//     });
//   }

//   const isUserAllowed = await getUserAllowedDb(userId);

//   // 2. All done!
//   return NextResponse.json({
//     allowed: isUserAllowed,
//   });
// };
