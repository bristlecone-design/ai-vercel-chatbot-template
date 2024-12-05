// import { NextResponse, type NextRequest } from 'next/server';
// import { deleteMedia } from '@/actions/media';
// import { del } from '@vercel/blob';
// import { StatusCodes } from 'http-status-codes';

// import { getErrorMessage } from '@/lib/errors';

// // export const runtime = 'nodejs';

// export async function DELETE(request: NextRequest) {
//   const mediaIdToDelete = request.nextUrl.searchParams.get('mediaId');

//   if (!mediaIdToDelete) {
//     return new Response('No Media ID provided', {
//       status: StatusCodes.BAD_REQUEST,
//     });
//   }

//   try {
//     const deletedMedia = await deleteMedia(mediaIdToDelete);

//     // Vercel Blob delete
//     let deletedFromBlob = false;
//     if (deletedMedia.urlOriginal) {
//       await del(deletedMedia.urlOriginal);
//       deletedFromBlob = true;
//     }

//     return NextResponse.json({
//       deleted: Boolean(deletedMedia),
//       record: deletedMedia,
//       deletedFromBlob,
//     });
//   } catch (e) {
//     const errMsg = getErrorMessage(e);
//     console.error('Error in DELETE /api/user/media/remove', errMsg);
//     return new Response(`Error removing media: ${errMsg}`, {
//       status: StatusCodes.INTERNAL_SERVER_ERROR,
//     });
//   }
// }
