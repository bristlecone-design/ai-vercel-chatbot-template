// import { NextResponse, type NextRequest } from 'next/server';
// import { toggleMediaRemoveStatus } from '@/actions/media';
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
//     const removedMedia = await toggleMediaRemoveStatus(mediaIdToDelete, true);

//     // Vercel Blob delete
//     let removedFromBlob = false;
//     if (removedMedia.urlOriginal) {
//       await del(removedMedia.urlOriginal);
//       removedFromBlob = true;
//     }

//     return NextResponse.json({
//       removed: Boolean(removedMedia),
//       record: removedMedia,
//       removedFromBlob,
//     });
//   } catch (e) {
//     const errMsg = getErrorMessage(e);
//     console.error('Error in DELETE /api/user/media/remove', errMsg);
//     return new Response(`Error removing media: ${errMsg}`, {
//       status: StatusCodes.INTERNAL_SERVER_ERROR,
//     });
//   }
// }
