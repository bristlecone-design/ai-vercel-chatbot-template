// import { revalidatePath } from 'next/cache';
// import { NextResponse } from 'next/server';
// import { updateUserBanner as updateUserBannerInDb } from '@/actions/user-db';
// import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

// import { getUserSession } from '@/lib/session';

// /**
//  * Handle the upload of a user's profile banner client-side
//  *
//  * @reference https://vercel.com/docs/storage/vercel-blob/using-blob-sdk
//  */

// export async function POST(request: Request): Promise<NextResponse> {
//   const body = (await request.json()) as HandleUploadBody;

//   try {
//     const jsonResponse = await handleUpload({
//       body,
//       request,
//       onBeforeGenerateToken: async (pathname, clientPayload) => {
//         console.log(
//           `***** onBeforeGenerateToken for user banner upload client-side`,
//           pathname,
//           clientPayload
//         );
//         // Generate a client token for the browser to upload the file
//         // ⚠️ Authenticate and authorize users before generating the token.
//         // Otherwise, you're allowing anonymous uploads.
//         const user = (await getUserSession())?.user;
//         const userId = user?.id;
//         if (!userId) {
//           throw new Error('Unauthorized');
//         }

//         const parsedClientPayload = clientPayload
//           ? JSON.parse(clientPayload)
//           : {};

//         const tokenPayload = JSON.stringify({
//           userId,
//           pathname: parsedClientPayload.pathname || pathname || '',
//           // optional, sent to your server on upload completion
//           // you could pass a user id from auth, or a value from clientPayload
//         });
//         // console.log(`**** tokenPayload`, tokenPayload);

//         return {
//           allowedContentTypes: [
//             'image/jpeg',
//             'image/jpg',
//             'image/png',
//             'image/gif',
//             'video/mp4',
//             'video/mov',
//             'video/quicktime',
//           ],
//           tokenPayload,
//         };
//       },
//       onUploadCompleted: async ({ blob, tokenPayload }) => {
//         // Get notified of client upload completion
//         // ⚠️ This will not work on `localhost` websites,
//         // Use ngrok or similar to get the full upload flow
//         console.log('User banner blob upload completed', blob, tokenPayload);

//         try {
//           // Run any logic after the file upload completed
//           const { userId, pathname: pathToRevalidate = '' } = tokenPayload
//             ? JSON.parse(tokenPayload)
//             : { userId: null };

//           const { url } = blob;
//           if (userId) {
//             const bannerSavedToDb = await updateUserBannerInDb(userId, url);
//             console.log(`**** bannerSavedToDb`, userId, bannerSavedToDb, url);
//           }

//           if (pathToRevalidate) {
//             console.log(`**** pathToRevalidate`, pathToRevalidate);
//             revalidatePath(pathToRevalidate);
//           }
//         } catch (error) {
//           throw new Error(`Could not upload and save user's profile banner.`);
//         }
//       },
//     });

//     return NextResponse.json(jsonResponse);
//   } catch (error) {
//     return NextResponse.json(
//       { error: (error as Error).message },
//       { status: 400 } // The webhook will retry 5 times waiting for a 200
//     );
//   }
// }
