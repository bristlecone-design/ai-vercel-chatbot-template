import {
  getCachedFeaturedPromptCollections,
  getFeaturedPromptCollections,
} from '@/actions/prompts';
import { type NextRequest, NextResponse } from 'next/server';

// https://beta.nextjs.org/docs/routing/route-handlers

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#runtime
// export const runtime = 'edge';

// Revalidate every x minutes
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#revalidate
// export const revalidate = 0;

export { postHandler as POST };

type PostParamTypes = {
  storyId?: string;
  cached?: boolean;
  //   keysToOmit?: Array<keyof Prisma.UserOmit>;
};

// https://beta.nextjs.org/docs/routing/route-handlers#dynamic-route-handlers
const postHandler = async (
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) => {
  const body = (await request.json()) as PostParamTypes;
  // const params = await props.params;
  const cached = body.cached;

  const featuredStories = await (cached
    ? getCachedFeaturedPromptCollections()
    : getFeaturedPromptCollections());

  // 2. All done!
  return NextResponse.json(featuredStories);
};
