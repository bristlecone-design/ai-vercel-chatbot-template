import { isImageUrl } from '@/lib/media/media-utils';
import type { ExtractedFileContentResponse } from '@/lib/pinecone-langchain/route-types';

// Will parse any URL to extract the content
export const BASE_PARSE_API_URL = '/api/pinecone/extract';

/**
 * Map the URL to the appropriate API endpoint for parsing.
 *
 * @note Some URLs may require different parsing strategies.
 *
 * @param url
 * @returns apiEndpoint The API endpoint to use for parsing the URL content
 */
export function mapUrlToParseApiEndpoint(url: string): string {
  let apiEndpoint = BASE_PARSE_API_URL;

  if (url.includes('github.com')) {
    apiEndpoint = `${apiEndpoint}/github`;
  } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
    apiEndpoint = `${apiEndpoint}/youtube`;
  } else if (isImageUrl(url)) {
    apiEndpoint = `${apiEndpoint}/image`;
  }

  return apiEndpoint;
}

/**
 * Map certain urls to specific selectors for parsing
 *
 * @param url The URL to map
 * @param baseSelector The default selector to build upon
 *
 * @returns selector The selector to use for parsing the URL content
 */
export function mapUrlToParsingSelector(
  url: string,
  baseSelector = '',
): string {
  let selector = 'body';

  if (url.includes('tmcc.edu')) {
    selector = '.main-container, [role="main"], #page_wrapper';
  } else if (url.includes('vercel.com')) {
    selector = 'main';
  } else if (url.includes('x.com')) {
    selector = 'main[role="main"] > section';
  } else if (url.includes('instagram.com')) {
    selector = 'main article';
  } else if (url.includes('dascoinc.com')) {
    selector = 'main';
  } else if (url.includes('sciencedirect.com')) {
    selector = 'article';
  } else if (url.includes('linkedin.com')) {
    selector = 'main';
  } else if (url.includes('travelnevada.com')) {
    selector = 'main';
  } else if (url.includes('tonopahnevada.com')) {
    selector = '.entry-content-wrapper';
  } else if (url.includes('exploreelko.com')) {
    selector = '.post-content';
  } else if (url.includes('nevadatravel.net')) {
    selector = '.container.single-inner-container';
  } else if (url.includes('coffeebar.com')) {
    selector = '.lmnt-content-wrap';
  } else if (url.includes('villageatrancharrah.com')) {
    selector = 'main';
  } else if (url.includes('westernfolklife.org')) {
    selector = 'main';
  } else if (url.includes('californiatrailcenter.org')) {
    selector = '.mk-main-wrapper-holder';
  } else if (url.includes('visitlaketahoe.com')) {
    selector = 'main';
  }

  return selector ? selector : baseSelector;
}

/**
 * Handle the parsing of the URL content
 */
export async function parseUrlContent(
  url: string,
  selector = 'body',
): Promise<ExtractedFileContentResponse> {
  const apiEndpoint = mapUrlToParseApiEndpoint(url);
  const parsingSelector = mapUrlToParsingSelector(url, selector);

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    body: JSON.stringify({ url, selector: parsingSelector }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to parse the URL content for: ${url}`);
  }

  return response.json();
}
