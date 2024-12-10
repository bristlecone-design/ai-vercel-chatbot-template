import { getErrorMessage } from '@/lib/errors';
import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
// import {
//   getCachedSingleUserExperienceForFrontend,
//   getCachedUserExperiences,
//   getCachedUserProfileExperiencesForFrontend,
//   getSingleExperience,
//   toggleExperienceRemovedStatus,
// } from '@/actions/experiences';
// import { StatusCodes } from 'http-status-codes';

// import { getErrorMessage } from '@/lib/errors';

// // export const runtime = 'nodejs';

// export { deleteHandler as DELETE, getHandler as GET };

// type ParamTypes = {
//   expId: string;
// };

// type ActionType = 'all' | 'single';
// type DataType = 'raw' | 'frontend';

// /**
//  * Handles adding a user experience
//  *
//  * TODO: Implement this function
//  */

// /**
//  * Handles getting a single or all user experience(s)
//  */
const getHandler = async (request: NextRequest) => {
  try {
    // const userId =
    //   (request.nextUrl.searchParams.get('userId') as string) || null;

    // if (!userId) {
    //   const statusText = 'User ID for experiences not provided';
    //   return new Response(statusText, {
    //     status: StatusCodes.BAD_REQUEST,
    //     statusText,
    //   });
    // }

    // const dataType = (request.nextUrl.searchParams.get('type') ||
    //   'raw') as DataType;

    // const actionType = (request.nextUrl.searchParams.get('action') ||
    //   'all') as ActionType;

    // // All experiences
    // if (actionType === 'all') {
    //   const experiences =
    //     (await (dataType === 'raw'
    //       ? getCachedUserExperiences(userId)
    //       : getCachedUserProfileExperiencesForFrontend(userId))) || [];

    return NextResponse.json({
      // userId,
      // dataType,
      // count: experiences.length || 0,
      // experiences,
    });

    //     const expId = (request.nextUrl.searchParams.get('expId') as string) || null;
    //     if (!expId) {
    //       const statusText = 'Experience ID not provided';
    //       return new Response(statusText, {
    //         status: StatusCodes.BAD_REQUEST,
    //         statusText,
    //       });
    //     }

    //     // Single experience
    //     const experience = await (dataType === 'raw'
    //       ? getSingleExperience(expId)
    //       : getCachedSingleUserExperienceForFrontend(expId, {
    //           media: true,
    //           mediaThumbnail: true,
    //           bookmarks: true,
    //           likes: true,
    //         }));

    //     return NextResponse.json({
    //       expId,
    //       found: Boolean(experience),
    //       record: experience,
    //     });
  } catch (error) {
    const errMsg = getErrorMessage(error);
    const baseErrMsg = 'Failed to get user experience(s)';
    console.log(baseErrMsg, error);
    return new Response(`${baseErrMsg}: ${errMsg}`, {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      statusText: errMsg,
    });
  }
};

// /**
//  * Delete a user's experience
//  */
// const deleteHandler = async (request: NextRequest) => {
//   try {
//     const body = (await request.json()) as {
//       id: string;
//     };
//     const { id: expId } = body;

//     if (!expId) {
//       const statusText = 'Experience ID not provided';
//       return new Response(statusText, {
//         status: StatusCodes.BAD_REQUEST,
//         statusText,
//       });
//     }

//     const response = await toggleExperienceRemovedStatus(expId, true);

//     if (!response || !response.record) {
//       return NextResponse.json({
//         success: false,
//         msg: response?.msg,
//         expId,
//       });
//     }

//     return NextResponse.json({
//       success: true,
//       record: response.record,
//       expId,
//     });
//   } catch (error) {
//     const errMsg = getErrorMessage(error);
//     const baseErrMsg = 'Failed to delete a user experience';
//     console.log(baseErrMsg, error);
//     return new Response(`${baseErrMsg}: ${errMsg}`, {
//       status: StatusCodes.INTERNAL_SERVER_ERROR,
//       statusText: errMsg,
//     });
//   }
// };
