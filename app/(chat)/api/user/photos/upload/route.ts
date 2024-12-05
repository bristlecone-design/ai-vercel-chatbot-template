import { NextResponse, type NextRequest } from 'next/server';
import { uploadUserExperienceMediaMultiple } from '@/actions/experiences-kv';
import { StatusCodes } from 'http-status-codes';

import { getErrorMessage } from '@/lib/errors';
import { getAllFilesFromFormData } from '@/lib/forms/form-utils';

import type { UserExperienceUploadParams } from '@/types/uploads';

// export const runtime = 'edge';

export { handler as POST };

type PostParams = UserExperienceUploadParams & {};

/**
 * Handles resetting a chat's cache, both /chat/ and /share/ paths
 */
const handler = async (request: NextRequest) => {
  try {
    const formData = await request.formData();
    const files = getAllFilesFromFormData(formData);
    const bypassAuth = formData.get('bypassAuth') === 'true';
    const folderName = formData.get('prefix') as string;
    const fileNamePrefix = formData.get('fileNamePrefix') as string;

    if (!files || files.length === 0) {
      return new Response('No file provided', {
        status: StatusCodes.BAD_REQUEST,
      });
    }

    const blob = await uploadUserExperienceMediaMultiple(formData, {
      fileNamePrefix,
      prefix: folderName,
      bypassAuth,
    });

    return NextResponse.json(blob);
  } catch (error) {
    const errMsg = getErrorMessage(error);
    const baseErrMsg = 'Failed to upload user photo(s)';
    console.log(baseErrMsg, error);
    return new Response(`${baseErrMsg}: ${errMsg}`, {
      status: 500,
      statusText: errMsg,
    });
  }
};
