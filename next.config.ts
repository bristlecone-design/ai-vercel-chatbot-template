import type { NextConfig } from 'next';

import type { RemotePattern } from 'next/dist/shared/lib/image-config';

import { IS_LOCAL_DEVELOPMENT } from '@/lib/getBaseUrl';

// https://nextjs.org/docs/pages/api-reference/next-config-js

// https://beta.nextjs.org/docs/configuring/typescript

const STORE_ID = process.env.BLOB_READ_WRITE_TOKEN?.match(
  /^vercel_blob_rw_([a-z0-9]+)_[a-z0-9]+$/i,
)?.[1].toLowerCase();

const HOSTNAME_VERCEL_BLOB = STORE_ID
  ? `${STORE_ID}.public.blob.vercel-storage.com`
  : undefined;

const createRemotePattern = (
  hostname = '',
  protocol = 'https',
  port = '',
  pathname = '/**',
) => {
  const pattern = hostname
    ? ({
        hostname,
        protocol,
        port,
        pathname,
      } as RemotePattern)
    : undefined;

  return (pattern ? [pattern] : []) as RemotePattern[];
};

// https://nextjs.org/docs/advanced-features/security-headers
const ContentSecurityPolicy = `
    default-src 'self';
    manifest-src 'self' *.nv.guide nv.guide;
    script-src 'self' 'unsafe-eval' 'unsafe-inline' *.youtube.com *.twitter.com *.vercel-scripts.com *.vercel-insights.com *.github.com *.googleapis.com ai.tmcc.chat research.dri.chat *.nv.guide *.file-examples.com *.ngrok-free.app;
    child-src *.youtube.com *.google.com *.twitter.com *.vimeo.com *.github.com ai.tmcc.chat research.dri.chat *.ngrok-free.app;
    worker-src 'self' blob:;
    style-src 'self' 'unsafe-inline' *.googleapis.com *.googleusercontent.com;
    img-src * blob: data:;
    media-src 'self' https://tesla-cdn.thron.com *.github.com *.vercel-storage.com *.file-examples.com *.ngrok-free.app blob: data:;
    connect-src *.googleusercontent.com *.ngrok-free.app *;
    font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com;
`;

const initialRemotePatterns = [] as RemotePattern[];

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    ppr: true,
    // dynamicIO: true,

    // https://nextjs.org/docs/app/api-reference/next-config-js/serverComponentsHmrCache
    serverComponentsHmrCache: IS_LOCAL_DEVELOPMENT,
    serverActions: {
      // https://nextjs.org/docs/app/api-reference/next-config-js/serverActions#bodysizelimit
      bodySizeLimit: '10mb',
    },
  },

  eslint: {
    // Warning: This allows production builds to successfully complete even if your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

  typescript: {
    // !! DANGER WILL ROBINSON !!
    // Dangerously allow builds to successfully complete even if
    // your project has type errors.
    // ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: initialRemotePatterns
      .concat(createRemotePattern(HOSTNAME_VERCEL_BLOB))
      .concat(createRemotePattern('avatar.vercel.sh'))
      .concat(createRemotePattern('ai-vercel-chatbot-template.vercel.app'))
      .concat(createRemotePattern('experience.nv.guide'))
      .concat(createRemotePattern('avatars.githubusercontent.com'))
      .concat(createRemotePattern('lh3.googleusercontent.com'))
      .concat(createRemotePattern('s3.amazonaws.com'))
      .concat(createRemotePattern('maps.googleapis.com'))
      .concat(createRemotePattern('places.googleapis.com'))
      .concat(createRemotePattern('cdn-design.tesla.com'))
      .concat(createRemotePattern('tesla-cdn.thron.com'))
      .concat(createRemotePattern('a.storyblok.com'))
      .concat(createRemotePattern('ai.tmcc.chat'))
      .concat(createRemotePattern('images.unsplash.com'))
      .concat(createRemotePattern('travelnevada.com'))
      .concat(createRemotePattern('tonopahnevada.com'))
      .concat(createRemotePattern('www.tonopahnevada.com'))
      .concat(createRemotePattern('exploreelko.com'))
      .concat(createRemotePattern('www.ruralroundup.com'))
      .concat(createRemotePattern('ruralroundup.com'))
      .concat(createRemotePattern('parks.nv.gov'))
      .concat(createRemotePattern('ngrok-free.app'))
      .concat(createRemotePattern('nv.gov'))
      .concat(createRemotePattern('www.nv.gov'))
      .concat(
        createRemotePattern('localhost', 'http', process.env.PORT || '3000'),
      ),
  },

  redirects: async () => [
    {
      source: '/challenge',
      destination: '/prompts',
      permanent: true,
    },
    {
      source: '/challenges',
      destination: '/prompts',
      permanent: true,
    },
    {
      source: '/challenges/completed',
      destination: '/prompts',
      permanent: true,
    },
    {
      source: '/challenges/completed/:id',
      destination: '/prompts/completed/:id',
      permanent: true,
    },
    // RegEx source that ends in 'media'
    // {
    //   source: '/profile/:path(media)',
    //   destination: '/:path*',
    //   permanent: true,
    // },
  ],
};

export default nextConfig;
