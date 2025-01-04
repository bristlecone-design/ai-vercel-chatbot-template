// import { getUserProfileDb } from '@/actions/user-db';
import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { lookupEmbeddingByHash } from '@/lib/db/queries/embeddings';
import {
  deleteResource,
  insertResourceWithEmbeddings,
} from '@/lib/db/queries/resource';
import {
  type NewResourceParams,
  resourceInsertSchema,
} from '@/lib/db/schemas/schema-content-resources';
import { generateResourceContentHash } from '@/lib/embed-utils';
import { getUserFromSession } from '@/lib/session';

// https://beta.nextjs.org/docs/routing/route-handlers

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

  // Check for existing resource with same hash
  const { hash: contentHash, seed: contentSeed } =
    generateResourceContentHash(createPayload);

  const existingResource = await lookupEmbeddingByHash(contentHash);
  const { resourceId: existingResourceId } = existingResource || {};

  // All good - insert away if no existing resource or reinsert flag is set
  if (reinsert || !existingResourceId) {
    const insertedResource = await insertResourceWithEmbeddings({
      resource: createPayload,
    });

    // If reinserting, delete the existing resource
    if (insertedResource && existingResourceId && reinsert) {
      await deleteResource(existingResourceId);
    }

    return NextResponse.json({
      msg: 'Resource inserted',
      reinserted: reinsert && reinsert,
      insertedResource,
      existingResource,
    });
  }

  return NextResponse.json({
    msg: 'Resource already exists and not reinserted',
    reinserted: reinsert,
    existingResource,
  });
};
