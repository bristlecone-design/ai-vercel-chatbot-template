import { createResourceContent } from '@/actions/resource';
import {
  type NewResourceParams,
  resourceInsertSchema,
} from '@/lib/db/schemas/schema-content-resources';
import { getErrorMessage } from '@/lib/errors';
import { getUserFromSession } from '@/lib/session';
// import { getUserProfileDb } from '@/actions/user-db';
import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Creates new resource content for users
 *
 * @note Content is discoverable via the search and GenUI user interfaces
 */

// https://nextjs.org/docs/app/building-your-application/routing/route-handlers

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#runtime
// export const runtime = 'nodejs';

type POST_PARAMS = {
  userId: string;
  bypassAuth?: boolean;
  useAdminId?: boolean;
  reinsert?: boolean;
  resource: NewResourceParams;
};

export { handler as POST };
// export { handler as GET, handler as POST };

// Handler for all requests
const handler = async (request: NextRequest) => {
  const body = (await request.json()) as POST_PARAMS;
  const {
    resource,
    userId: userIdProp,
    bypassAuth = false,
    useAdminId = false,
    reinsert = false,
  } = body;

  let user;
  if (!bypassAuth) {
    user = await getUserFromSession();
    if (!user) {
      return new Response('User not authenticated', {
        status: StatusCodes.BAD_REQUEST,
      });
    }
  }

  const userId = user?.id || userIdProp || useAdminId ? '111233296' : null;

  if (!userId && !useAdminId) {
    return new Response('User ID not specified', {
      status: StatusCodes.BAD_REQUEST,
    });
  }

  const createPayload = {
    ...(resource || {}),
    userId,
  } as NewResourceParams;

  // Validate the resource data
  const resourceValid = resourceInsertSchema.safeParse(createPayload);

  if (!resourceValid.success) {
    return Response.json(
      { msg: 'Resource data invalid', validation: resourceValid.error },
      {
        status: StatusCodes.BAD_REQUEST,
      },
    );
  }

  try {
    const {
      msg,
      reinserted,
      resource: insertedResource,
    } = await createResourceContent(createPayload, {
      reinsert,
      userId,
    });

    return NextResponse.json({
      msg,
      reinserted,
      resource: insertedResource,
    });
  } catch (error) {
    const errMsg = getErrorMessage(error);
    return new Response(errMsg, {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};
