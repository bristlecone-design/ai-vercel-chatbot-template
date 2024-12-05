// import { revalidatePath } from 'next/cache';
// import { NextResponse } from 'next/server';
// import { clearTagCache } from '@/actions/cache';
// import {
//   connectMediaToExperience,
//   addUserSingleMedia as saveUserSingleMedia,
// } from '@/actions/media';
// import { getImageBasicExifDataFromBlob } from '@/photo/server';
// import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

// import { ACCEPTED_IMG_VIDEO_MEDIA_TYPES } from '@/lib/images';
// import { isImage, isImageExtension } from '@/lib/media/media-utils';
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
//         console.log(
//           '***** onBeforeGenerateToken in media/upload/client route',
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
//           revalidatePath: parsedClientPayload.pathname || '',
//           experienceId: parsedClientPayload.experienceId || '',
//           cacheKey: parsedClientPayload.cacheKey || '',
//           // optional, sent to your server on upload completion
//           // you could pass a user id from auth, or a value from clientPayload
//         });
//         // console.log(`**** tokenPayload`, tokenPayload);

//         return {
//           allowedContentTypes:
//             parsedClientPayload.allowedContentTypes ||
//             ACCEPTED_IMG_VIDEO_MEDIA_TYPES,
//           tokenPayload,
//         };
//       },
//       onUploadCompleted: async ({ blob, tokenPayload }) => {
//         // Get notified of client upload completion
//         // ⚠️ This will not work on `localhost` websites,
//         // Use ngrok or similar to get the full upload flow
//         console.log('blob upload completed for user media', blob, tokenPayload);

//         try {
//           // Run any logic after the file upload completed
//           const {
//             userId,
//             cacheKey,
//             experienceId,
//             revalidatePath: pathToRevalidate = '',
//           } = tokenPayload
//             ? JSON.parse(tokenPayload)
//             : {
//                 userId: null,
//                 experienceId: null,
//                 revalidatePath: '',
//                 cacheKey: '',
//               };

//           const { url } = blob;

//           // Get the basic exif data from the uploaded image
//           // And save it to the user's media library
//           if (userId) {
//             const isMediaAnImage = isImageExtension(url) || isImage(url);
//             const imageWithExif = isMediaAnImage
//               ? await getImageBasicExifDataFromBlob(url, {
//                   generateBlurData: true,
//                   generateThumbnail: false,
//                 })
//               : null;

//             const saveMediaRes = await saveUserSingleMedia(
//               userId,
//               url,
//               (imageWithExif || {}) as PhotoBasicExifData
//             );

//             if (!saveMediaRes) {
//               return;
//             }

//             const savedMediaId = saveMediaRes.id;
//             // console.log(
//             //   `**** saveMedia response in media/upload endpoint`,
//             //   saveMediaRes
//             // );
//             // Connect the media to the experience if provided
//             if (experienceId && savedMediaId) {
//               // console.log(`**** connecting media to experience`, {
//               //   experienceId,
//               //   mediaId: saveMediaRes.id,
//               // });
//               const mediaId = saveMediaRes.id;
//               const connectMediaToExperienceRes =
//                 await connectMediaToExperience(experienceId, mediaId);
//               // console.log(
//               //   `**** connectMediaToExperienceRes`,
//               //   connectMediaToExperienceRes
//               // );
//             }

//             // Clear the cache for the user's media library
//             if (savedMediaId && cacheKey) {
//               console.log('**** clearing cache for user media library', {
//                 cacheKey,
//               });
//               clearTagCache(cacheKey);
//             }
//           }

//           if (pathToRevalidate) {
//             // console.log(`**** pathToRevalidate`, pathToRevalidate);
//             revalidatePath(pathToRevalidate);
//           }

//           // return { success: true };
//         } catch (error) {
//           throw new Error('Could not update user with new uploaded image.');
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
