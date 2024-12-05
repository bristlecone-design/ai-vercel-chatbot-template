// import { upsertUserAccount } from '@/actions/account';
// import { addUser as addUserToRedis } from '@/actions/user-kv';
// import { StatusCodes } from 'http-status-codes';
// import { type NextRequest, NextResponse } from 'next/server';

// import { nanoid } from '@/lib/utils';

// import type { USER_MODEL } from '@/types/user';

// // https://beta.nextjs.org/docs/routing/route-handlers

// // https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#runtime
// // export const runtime = 'nodejs';

// export { handler as POST };

// type UserSaveParamTypes = {
//   provider: string;
//   user: Partial<USER_MODEL>;
//   redis: boolean;
//   bypass: boolean;
// };

// // https://beta.nextjs.org/docs/routing/route-handlers#dynamic-route-handlers
// const handler = async (request: NextRequest) => {
//   let user: UserSaveParamTypes['user'] | undefined;
//   let provider: UserSaveParamTypes['provider'] = '';
//   let redis: UserSaveParamTypes['redis'] = true;
//   let bypass: UserSaveParamTypes['bypass'] = false;

//   // Data from POST
//   ({
//     user,
//     provider,
//     redis = true,
//     bypass,
//   } = await request.json()) as UserSaveParamTypes;

//   // console.log(`***** api/user/save route invoked`, user, redis, bypass);
//   if (!user && !bypass) {
//     const statusText = 'User data not provided';
//     return new Response(statusText, {
//       status: StatusCodes.BAD_REQUEST,
//       statusText,
//     });
//   }

//   let redisPayload = {};
//   let userUpsertToRedisRes: any = undefined;
//   const userId = String(user?.id ?? nanoid());
//   // console.log(`payload passed to save endpoint`, user);
//   // console.log(`userId to use in save endpoint`, userId);

//   // 1. Save to DB
//   const accountPayload = {
//     provider: provider,
//   };

//   const userPayload = {
//     ...user,
//   };

//   const userUpsertRes = await upsertUserAccount(
//     userId,
//     accountPayload,
//     userPayload,
//   );

//   // 2. Sync w/Redis
//   if (redis && userId) {
//     redisPayload = {
//       ...user,
//       id: userId,
//     } as USER_MODEL;

//     userUpsertToRedisRes = await addUserToRedis(userId, redisPayload);
//   }

//   // 2. All done!
//   return NextResponse.json({
//     userId: userId,
//     data: {
//       successful: Boolean(userUpsertRes),
//       db: userUpsertRes,
//       redis: redisPayload,
//     },
//   });
// };
