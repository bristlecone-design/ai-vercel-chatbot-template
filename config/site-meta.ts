import type {
  Metadata,
  ResolvingMetadata as ResolvingMetadataSource,
} from 'next';

import { BASE_URL } from '@/lib/getBaseUrl';
import { siteConfig } from './site-base';

const hostUrl = BASE_URL as string | URL;

export type ResolvingMetadata = ResolvingMetadataSource;

export interface BaseMetadata extends Metadata {}

interface SiteConfig extends BaseMetadata {
  name: string;
  shortName: string;
  contact: string;
  institutionName?: string;
  institutionAbbr?: string;
  briefDescription: string;
  description: string;
  locale?: string;
  auth: {
    providers: {
      github: {
        enabled: boolean;
        link: string;
      };
      google?: {
        enabled: boolean;
        link: string;
      };
      microsoft?: {
        enabled: boolean;
        link: string;
      };
    };
  };
  social: {
    twitter?: string | undefined;
    github?: string | undefined;
    google?: string | undefined;
    personal?: string | undefined;
  };
  links?: {
    twitter?: string | undefined;
    github?: string | undefined;
    google?: string | undefined;
    personal?: string | undefined;
  };
}

export const getTitleTemplate = (title?: string | null, withAbout = true) => {
  const baseTitle = withAbout
    ? `${siteConfig.title} - ${siteConfig.aboutTitle} ✨`
    : `${siteConfig.title} ✨`;

  return title ? `%s | ${baseTitle}`.replace('%s', title) : baseTitle;
};

export const getAboutTitleTemplate = (
  title?: string | null,
  separator = '|',
) => {
  const baseTitle = ` ${siteConfig.aboutTitle} ✨`;

  return title
    ? `%s ${separator} ${baseTitle}`.replace('%s', title)
    : baseTitle;
};

export const getCustomTitleTemplate = (
  title: string,
  suffix?: string | null,
) => {
  const baseTitle = title;

  return suffix ? `${baseTitle} | %s`.replace('%s', suffix) : baseTitle;
};

// https://beta.nextjs.org/docs/api-reference/metadata
export const siteMeta: SiteConfig = {
  metadataBase: hostUrl ? new URL(hostUrl) : undefined,
  name: siteConfig.title,
  shortName: siteConfig.shortTitle,
  contact: siteConfig.contact.name,
  institutionName: '',
  institutionAbbr: '',
  briefDescription: siteConfig.subTitle,
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  locale: 'en-US',
  auth: {
    providers: {
      github: {
        enabled: true,
        link: '/login',
      },
      google: {
        enabled: true,
        link: '/login',
      },
      microsoft: {
        enabled: false,
        link: '/login',
      },
    },
  },
  social: {
    twitter: '@mannybreno',
    github: 'mannybecerra',
    google: '',
    personal: '',
  },
  // https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
  robots: {
    index: true,
    follow: true,
    // nocache: true,
    googleBot: {
      index: true,
      follow: true,
      // noimageindex: true,
      // "max-video-preview": -1,
      // "max-image-preview": "large",
      // "max-snippet": -1,
    },
  },
};

export const OG_BRANDED_IMAGES = {
  DEFAULT: `${hostUrl}/api/og`,
  PORTRAIT: `${hostUrl}/api/og?orientation=portrait`,
  DISCOVERIES: `${hostUrl}/api/og/discovery`,
  EXPERIENCES: `${hostUrl}/api/og/experience`,
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

// @see https://beta.nextjs.org/docs/api-reference/metadata#ordering
export const metadata: BaseMetadata = {
  metadataBase: siteMeta.metadataBase,
  title: {
    default: `${siteMeta.shortName} - ${siteMeta.briefDescription} ✨`,
    template: `%s | ${siteMeta.briefDescription} ✨`,
  },
  description: siteMeta.description,
  creator: siteMeta.contact,
  publisher: siteMeta.contact,
  manifest: hostUrl ? `${hostUrl}/manifest.json` : undefined,
  // alternates: {
  //   canonical: CANONICAL_ABSOLUTE_URL || hostUrl,
  // },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      new URL('/favicon-32x32.png', hostUrl),
    ],
    shortcut: ['/favicon-32x32.png'],
    apple: [
      { url: '/apple-touch-icon.png' },
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: getTitleTemplate(),
    description: siteMeta.description,
    url: hostUrl,
    siteName: siteMeta.name,
    images: [
      // {
      //   url: `${hostUrl}/og.png`,
      // },
      {
        url: OG_BRANDED_IMAGES.DEFAULT,
      },
      // {
      //   url: `https://tesla-cdn.thron.com/delivery/public/image/tesla/81e92537-afa7-46e5-92e1-6882714abf4f/bvlatuR/std/1440x540/supercharger-family-social`,
      //   // width: 800,
      //   // height: 600,
      // },
      // {
      //   url: "https://nextjs.org/og-alt.png",
      //   width: 1800,
      //   height: 1600,
      //   alt: "My custom alt",
      // },
    ],
    locale: siteMeta.locale,
    authors: [siteMeta.contact],
    // type: 'website',
  },
  twitter: {
    // card: 'app',
    title: siteMeta.name,
    description: siteMeta.description,
    site: siteMeta.social.twitter,
    // siteId: "1467726470533754880",
    creator: siteMeta.social.twitter,
    // creatorId: "1467726470533754880",
    images: [
      {
        url: OG_BRANDED_IMAGES.DEFAULT,
      },
    ],
  },
};
