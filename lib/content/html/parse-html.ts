import { load } from 'cheerio';

import { isAbsoluteUrl } from '../../media/media-utils';

export type ExtractedUrls = string[];

export interface ParsedHtmlResponse {
  [key: string]: string | boolean | ExtractedUrls | undefined | null;
  title?: string;
  content: string;
  description?: string;
  urls?: ExtractedUrls;
}

/**
 * Parse the HTML and return the content with some metadata, including URLs
 *
 * @param html - The HTML to parse
 * @param selector - The selector to scope the content
 *
 * @returns The HTML content and other metadata
 *
 * @see https://cheerio.js.org/docs/advanced/extract for advanced usage
 *
 */
export function parseHtml(html: string, selector?: string): ParsedHtmlResponse {
  let finalContent: string | null = null;
  let contentTitle: string | undefined;
  let contentDescription: string | undefined;
  let urls: ExtractedUrls = [];

  try {
    const $ = load(html);
    $('a').removeAttr('href');

    const scopedContent =
      selector && $(selector).html() ? $(selector).html() : null;

    // Main content
    finalContent = scopedContent ?? $.html();

    // Metadata
    contentTitle = $('title').text() || '';
    contentDescription = $('meta[name="description"]').attr('content') || '';
    urls = extractUrls(finalContent);
  } catch (error) {
    console.error(`Failed to parse HTML: ${error}`);
    return { content: '' };
  }

  return {
    title: contentTitle.trim(),
    content: finalContent,
    description: contentDescription,
    urls,
  };
}

/**
 * Extract URLs from the HTML content
 *
 * @param html - The HTML to parse
 * @param baseUrl - Optional. Base URL with standard protocol to use for relative URLs
 *
 * @returns Array of URLs found in the HTML if any
 */
export function extractUrls(html: string, baseUrl?: string): string[] {
  const $ = load(html);
  const urls: string[] = [];

  $('a').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      const xHref =
        baseUrl && !isAbsoluteUrl(href) ? new URL(href, baseUrl).href : href;
      urls.push(xHref);
    }
  });

  return urls;
}
