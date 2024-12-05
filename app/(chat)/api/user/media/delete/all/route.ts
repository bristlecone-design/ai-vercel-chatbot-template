// import { NextResponse, type NextRequest } from 'next/server';
// import { clearTagCache } from '@/actions/cache';
// import { deleteMedia, getMediaByAuthorId } from '@/actions/media';
// import { del } from '@vercel/blob';
// import { StatusCodes } from 'http-status-codes';

// import { getErrorMessage } from '@/lib/errors';

// // export const runtime = 'nodejs';

// export async function DELETE(request: NextRequest) {
//   const userId = request.nextUrl.searchParams.get('userId');

//   if (!userId) {
//     return new Response('No User ID provided', {
//       status: StatusCodes.BAD_REQUEST,
//     });
//   }

//   try {
//     const userMedia = await getMediaByAuthorId(userId, true, false);
//     const userMediaIds = userMedia.map((media) => media.id);

//     if (!userMedia || !userMedia.length) {
//       return new Response(`No media found for user with ID ${userId}`, {
//         status: StatusCodes.NOT_FOUND,
//       });
//     }

//     const deletedMedia = userMedia.flatMap(async (mediaIdToDelete) => {
//       const mediaUserId = mediaIdToDelete.user.id;
//       if (String(mediaUserId) !== String(userId)) {
//         return {
//           deleted: false,
//           record: mediaIdToDelete,
//           deletedFromBlob: false,
//         };
//       }

//       const mediaId = mediaIdToDelete.id;
//       const deleted = await deleteMedia(mediaId);

//       // Vercel Blob delete
//       let deletedFromBlob = false;
//       if (deleted.urlOriginal) {
//         await del(deleted.urlOriginal);
//         deletedFromBlob = true;
//       }

//       if (deleted.experienceId) {
//         await clearTagCache(deleted.experienceId);
//       }

//       return {
//         deleted: Boolean(deleted),
//         record: deleted,
//         deletedFromBlob,
//       };
//     });

//     return NextResponse.json({
//       deleted: Boolean(deletedMedia),
//       records: deletedMedia,
//       userMediaIds,
//     });
//   } catch (e) {
//     const errMsg = getErrorMessage(e);
//     console.error('Error in DELETE /api/user/media/remove', errMsg);
//     return new Response(`Error removing media: ${errMsg}`, {
//       status: StatusCodes.INTERNAL_SERVER_ERROR,
//     });
//   }
// }
