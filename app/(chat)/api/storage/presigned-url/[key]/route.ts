import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { auth } from '@/lib/auth/edge-auth';
import { awsS3Client, awsS3PutObjectCommandForKey } from '@/lib/storage/aws-s3';
import {
  cloudflareR2Client,
  cloudflareR2PutObjectCommandForKey,
} from '@/lib/storage/cloudflare-r2';

import { CURRENT_STORAGE } from '@/config/site-settings';

export async function GET(_: Request, props: { params: Promise<{ key: string }> }) {
  const params = await props.params;

  const {
    key
  } = params;

  const session = await auth();
  if (session?.user && key) {
    const url = await getSignedUrl(
      CURRENT_STORAGE === 'cloudflare-r2'
        ? cloudflareR2Client()
        : awsS3Client(),
      CURRENT_STORAGE === 'cloudflare-r2'
        ? cloudflareR2PutObjectCommandForKey(key)
        : awsS3PutObjectCommandForKey(key),
      { expiresIn: 3600 }
    );
    return new Response(url, { headers: { 'content-type': 'text/plain' } });
  } else {
    return new Response('Unauthorized request', { status: 401 });
  }
}
