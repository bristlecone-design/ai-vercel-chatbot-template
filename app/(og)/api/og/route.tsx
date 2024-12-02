import type { NextRequest } from 'next/server';
import { ImageResponse } from '@vercel/og';
import { StatusCodes } from 'http-status-codes';

import { ogImageSchema } from '@/lib/og/og-schemas';
import { cn } from '@/lib/utils';

// import { Icons } from "@/components/icons";

// https://beta.nextjs.org/docs/api-reference/segment-config#runtime
// 'experimental-edge' | 'nodejs'
export const runtime = 'edge';

const geistRegular = fetch(
  new URL('../../../../fonts/Geist-Regular.otf', import.meta.url)
).then((res) => res.arrayBuffer());

const geistBold = fetch(
  new URL('../../../../fonts/Geist-Bold.otf', import.meta.url)
).then((res) => res.arrayBuffer());

async function handler(req: NextRequest) {
  try {
    const fontRegular = await geistRegular;
    const fontBold = await geistBold;

    const url = new URL(req.url);
    const values = ogImageSchema.parse(Object.fromEntries(url.searchParams));
    const heading =
      values.heading.length > 140
        ? `${values.heading.substring(0, 140)}...`
        : values.heading;

    const { mode, orientation } = values;
    const paint = mode === 'dark' ? '#fff' : '#000';
    // console.log(`OG orientation`, orientation)
    const isPortrait = orientation === 'portrait';
    // console.log(`isPortrait`, isPortrait)

    // Base font size determination
    let fontSize = heading.length > 100 ? '70px' : '112px';
    if (isPortrait) {
      fontSize = heading.length > 100 ? '50px' : '72px';
    }

    // Today's Date in Month Day, Year format
    // const date = new Date().toLocaleDateString("en-US", {
    //   month: "long",
    //   day: "numeric",
    //   year: "numeric",
    // });

    return new ImageResponse(
      (
        <div
          tw={cn('relative flex h-full w-full flex-col', {
            'p-14': !isPortrait,
            'p-10': isPortrait,
          })}
          style={{
            color: paint,
            // https://www.radix-ui.com/colors/custom
            background: mode === 'dark' ? '#0090FF' : 'white',
          }}
        >
          <div
            tw={cn('flex flex-1 flex-col', {
              'py-6': !isPortrait,
              'py-2': isPortrait,
            })}
          >
            <div
              tw={cn('flex font-bold uppercase tracking-tight', {
                'text-3xl mb-6 ': !isPortrait,
                'text-xl mb-8': isPortrait,
              })}
              style={{
                fontFamily: 'Geist',
                fontWeight: 'normal',
                color: '#eee',
                // fontSize: 'inherit'
              }}
            >
              {values.type}
            </div>
            <div
              tw="flex font-bold tracking-wide"
              style={{
                fontFamily: 'Geist',
                fontWeight: 'bolder',
                marginLeft: '-3px',
                fontSize,
              }}
            >
              {heading}
            </div>
          </div>
          <div
            tw={cn('mb-9 flex w-full', {
              'flex-col': isPortrait,
              'items-center justify-between': !isPortrait,
            })}
          >
            <div
              tw={cn('flex items-start', {
                'mb-4': isPortrait,
                'text-4xl': !isPortrait,
              })}
              style={{
                fontFamily: 'Geist',
                fontWeight: 'normal',
                lineHeight: '1.5',
                fontSize: isPortrait ? '28px' : '52px',
                color: '#eee',
              }}
            >
              {/* <Icons.bolt size="sm" /> */}
              <div tw="flex ml-2">Nevada&apos;s Biggest Little Gems</div>
            </div>
            <div
              tw={cn('flex flex-col text-sm', {
                'items-end justify-end': !isPortrait,
                'ml-2': isPortrait,
              })}
              style={{
                lineHeight: '1.5',
                fontFamily: 'Geist',
                fontWeight: 'normal',
                color: '#aaa',
              }}
            >
              <p tw="m-0 p-0">Powered by People, Public Data, AI, ❤️ and ☕</p>
              <p tw="m-0 p-0">
                Made in the Biggest Little City in the World 🫶🏼
              </p>
            </div>
          </div>
        </div>
      ),
      {
        width: isPortrait ? 480 : 1280,
        height: isPortrait ? 680 : 720,
        fonts: [
          {
            name: 'Geist',
            data: fontRegular,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Geist',
            data: fontBold,
            weight: 700,
            style: 'normal',
          },
        ],
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(`Failed to generate image`, {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
}

export { handler as GET };
