// import { NextResponse, type NextRequest } from 'next/server';
// import { getUserProfileDb } from '@/actions/user-db';
// import { StatusCodes } from 'http-status-codes';

// import { getUserFromSession } from '@/lib/session';

// // https://beta.nextjs.org/docs/routing/route-handlers

// // https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#runtime
// // export const runtime = 'nodejs';

// export { handler as POST };
// // export { handler as GET, handler as POST };

// // Handler for all requests
// const handler = async (request: NextRequest) => {
//   const user = await getUserFromSession();

//   if (!user) {
//     return new Response('User not found', {
//       status: StatusCodes.NOT_FOUND,
//     });
//   }

//   if (!user.id) {
//     return new Response('User ID not found', {
//       status: StatusCodes.BAD_REQUEST,
//     });
//   }

//   const userProfile = await getUserProfileDb(user.id);

//   return NextResponse.json({
//     user: userProfile,
//   });
// };
