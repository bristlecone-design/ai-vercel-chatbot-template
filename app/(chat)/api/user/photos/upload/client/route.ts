// import { revalidatePath } from 'next/cache';
// import { NextResponse } from 'next/server';
// import { addUserFeaturedImg } from '@/actions/featured-imgs';
// import { getImageBasicExifDataFromBlob } from '@/photo/server';
// import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

// import { getUserSession } from '@/lib/session';

// import type { PhotoBasicExifData } from '@/types/photo';

// export async function POST(request: Request): Promise<NextResponse> {
//   const body = (await request.json()) as HandleUploadBody;
//   // console.log(`**** api/photos/upload/client invoked`, body);

//   try {
//     const jsonResponse = await handleUpload({
//       body,
//       request,
//       onBeforeGenerateToken: async (pathname, clientPayload) => {
//         console.log('***** onBeforeGenerateToken', pathname, clientPayload);
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
//           pathname: parsedClientPayload.pathname || '',
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
//             'video/mov',
//             'video/mp4',
//             'video/quicktime',
//             // 'video/webm',
//           ],
//           tokenPayload,
//         };
//       },
//       onUploadCompleted: async ({ blob, tokenPayload }) => {
//         // Get notified of client upload completion
//         // ⚠️ This will not work on `localhost` websites,
//         // Use ngrok or similar to get the full upload flow

//         console.log('blob upload completed', blob, tokenPayload);

//         try {
//           // Run any logic after the file upload completed
//           const { userId, pathname: pathToRevalidate = '' } = tokenPayload
//             ? JSON.parse(tokenPayload)
//             : { userId: null };

//           const { url } = blob;
//           if (userId) {
//             const imageWithExif = await getImageBasicExifDataFromBlob(url, {
//               generateBlurData: true,
//               generateThumbnail: false,
//             });

//             const saveMedia = await addUserFeaturedImg(
//               userId,
//               url,
//               (imageWithExif || {}) as PhotoBasicExifData
//             );
//             // console.log(`**** saveMedia record`, saveMedia);
//           }

//           if (pathToRevalidate) {
//             console.log(`**** pathToRevalidate`, pathToRevalidate);
//             revalidatePath(pathToRevalidate);
//           }
//         } catch (error) {
//           throw new Error(`Could not update user with new uploaded image.`);
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
