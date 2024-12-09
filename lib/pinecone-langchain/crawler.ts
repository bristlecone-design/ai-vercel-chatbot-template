import { load } from 'cheerio';
import { NodeHtmlMarkdown } from 'node-html-markdown';

import { getErrorMessage } from '@/lib/errors';
import {
  isCsvUrl,
  isMarkdownUrl,
  isPdfUrl,
  isTextUrl,
  isWebpage,
  isWordDocUrl,
} from '@/lib/media/media-utils';
import type {
  CrawledPage,
  CrawledPageSourceInput,
  QueueCrawledItem,
  SourceTypes,
} from '@/lib/pinecone-langchain/metadata';

import { getBaseUrl } from '../getBaseUrl';
import { parseGrayMatterAndModifyText } from '../markdown';
import { DEFAULT_TRUNCATE_BYTES_AMOUNT } from './defaults';
import type { ExtractedRemoteContentResponse } from './route-types';

type ParsedTextResponse = { content: string; title?: string | undefined };

type NonSimpleResourceTypes = 'pdf' | 'doc' | 'csv';

/**
 * A simple web crawler that can crawl webpages, PDFs, Word documents, etc.
 *
 * @inspiration https://github.com/pinecone-io/chatbot-demo/blob/main/src/crawler.ts
 * @see https://github.com/langchain-ai/langchainjs/blob/main/langchain/src/document_loaders/web/cheerio.ts#L112
 * @see https://github.com/langchain-ai/langchainjs/blob/main/langchain-core/src/documents/document.ts
 */

export const DEFAULT_MAX_DEPTH = 3;
export const DEFAULT_MAX_PAGES = 1;

type CrawlerInstanceProps = {
  maxDepth?: number;
  maxPages?: number;
  truncateBytesAmount?: number;
  excludeUrlTypes?: string[];
  excludeUrlDomains?: string[];
  splitContent?: boolean;
};

export class Crawler {
  private seen = new Set<string>();
  private pages: CrawledPage[] = [];
  private maxDepth: number = DEFAULT_MAX_DEPTH;
  private maxPages: number = DEFAULT_MAX_PAGES;
  private truncateBytesAmount: number = DEFAULT_TRUNCATE_BYTES_AMOUNT;
  private queue: QueueCrawledItem[] = [];
  private excludeUrlTypes: string[] = [];
  private excludeUrlDomains: string[] = [];
  private splitContent = true;

  constructor(props: CrawlerInstanceProps = {}) {
    const {
      maxDepth = DEFAULT_MAX_DEPTH,
      maxPages = DEFAULT_MAX_PAGES,
      truncateBytesAmount = DEFAULT_TRUNCATE_BYTES_AMOUNT,
      excludeUrlTypes = [],
      excludeUrlDomains = [],
      splitContent = true,
    } = props;

    this.maxDepth = maxDepth;
    this.maxPages = maxPages;
    this.truncateBytesAmount = truncateBytesAmount;
    this.excludeUrlTypes = excludeUrlTypes;
    this.excludeUrlDomains = excludeUrlDomains;
    this.splitContent = splitContent;
    // console.log(`Crawler initialized with`, {
    //   maxDepth,
    //   maxPages,
    //   truncateBytesAmount,
    //   excludeUrlTypes,
    //   excludeUrlDomains,
    //   splitContent,
    // });
  }

  /**
   * Crawl a resource and return the pages. Acts as a wrapper around `crawlWebpage` and other crawl methods.
   *
   * @note - A resource can be a webpage, a PDF, a Word document, etc.
   *
   * @param resource - The path to the resource to crawl, e.g. a URL or a file path
   * @param sourceType - The type of the resource, e.g. "web", "pdf", "word", etc.
   * @param scope - A selector to limit the content to a specific part of a page. Only used for webpages.
   */
  async crawl(
    source: CrawledPageSourceInput,
    sourceType: CrawledPage['sourceType'] = 'web',
    title?: CrawledPage['title'],
    scope?: string,
  ): Promise<CrawledPage[]> {
    // console.log(`crawl invoked with`, {
    //   source,
    //   sourceType,
    //   scope,
    // });
    // For webpages and simple, online file content, e.g. .html, .txt, .md
    if (typeof source === 'string' && this.isValidWebFileResource(source)) {
      return await this.crawlWebpage(source, sourceType, title, scope);
    }

    // For other types of resources
    // Simple online files, e.g. .txt, .md
    if (
      typeof source === 'string' &&
      this.isValidSimpleFileUrlResource(source)
    ) {
      return this.crawlFileOrMarkdown(source);
    }

    return [];
  }

  async crawlWebpage(
    startUrl: string,
    sourceType: CrawledPage['sourceType'] = 'web',
    title?: CrawledPage['title'],
    scope?: string,
  ): Promise<CrawledPage[]> {
    // Scope is a way to limit the content to a specific part of the page; it's a cheerio selector (think jQuery)

    // Add the start URL to the queue
    this.addToQueue(startUrl, startUrl, sourceType);

    // While there are URLs in the queue and we haven't reached the maximum number of pages...
    while (this.shouldContinueCrawling()) {
      // Dequeue the next URL and depth
      const {
        title: urlResourceTitle,
        source,
        sourceType,
        depth,
      } = this.queue.shift()!;
      // console.log(
      //   `Dequeued: ${urlResourceTitle}, resource: ${resource}, source type: ${sourceType} with depth: ${depth}`
      // );

      // Validate resource type
      if (!this.isValidWebResource(urlResourceTitle)) continue;

      // At this point, the resource is 99.9% a string type
      const urlResource = source as string;
      // console.log(`urlResource`, urlResource);

      // If the depth is too great or we've already seen this URL, skip it
      if (this.isTooDeep(depth) || this.isUrlAlreadySeen(urlResource)) continue;

      // Add the URL to the set of seen URLs
      this.addUrlToSeen(urlResource);

      // Determine content type
      const isCsvFileUrl = isCsvUrl(urlResource);
      const isPdfFileUrl = isPdfUrl(urlResource);
      const isWordFileUrl = isWordDocUrl(urlResource);
      const isSimpleTextFileUrl = isTextUrl(urlResource);
      const isMarkdownFileUrl = isMarkdownUrl(urlResource);
      const isNonSimpleFileUrl = isPdfFileUrl || isWordFileUrl || isCsvFileUrl;
      // console.log(`is file type`, {
      //   isCsvFileUrl,
      //   isPdfFileUrl,
      //   isWordFileUrl,
      //   isSimpleTextFileUrl,
      //   isMarkdownFileUrl,
      //   isNonSimpleFileUrl,
      // });

      /**
       * Fetch and parse the content of the resource
       * @note - PDF files take a slightly different path
       */
      // Fetch the page HTML
      let fetchedResourceText;
      let contentTitle = title || urlResourceTitle;
      let parsedContent: ParsedTextResponse = { content: '' };

      if (isNonSimpleFileUrl) {
        const response = await this.fetchNonSimpleWebResource(urlResource);
        // console.log(`response metadata`, response.metadata);
        const { content, metadata } = response;
        fetchedResourceText = content;
        parsedContent = {
          content,
          title: metadata.title || metadata.documentName,
        };
      } else {
        fetchedResourceText = await this.fetchWebResource(urlResource);
        // console.log(`fetchedResourceText`, fetchedResourceText);

        // Parse the content of the resource based on the type
        parsedContent = isSimpleTextFileUrl
          ? this.parseText(fetchedResourceText)
          : isMarkdownFileUrl
            ? this.parseMarkdown(fetchedResourceText)
            : this.parseHtml(fetchedResourceText, scope);

        contentTitle = parsedContent.title || contentTitle;
      }

      // If the resource failed to fetch, skip it (it's required for the rest of the process)
      if (!fetchedResourceText) {
        console.error(`Failed to fetch resource: ${urlResource}`);
        continue;
      }

      // Add the page to the list of crawled pages/URLs
      const crawledPage: CrawledPage = {
        title: parsedContent.title || contentTitle,
        documentName: parsedContent.title || contentTitle,
        source: urlResource,
        content: parsedContent.content,
        sourceType,
      };

      this.pages.push(crawledPage);

      // Extract new URLs from the web resource and add them to the queue
      this.addNewUrlsToQueue(
        this.extractUrls(fetchedResourceText, urlResource),
        depth,
        sourceType,
      );
    }

    // Return the list of crawled pages
    return this.pages;
  }

  /**
   * Crawl a simple file or markdown file and return the content as a page
   *
   * @note the `crawlWebpage` method can also be used to crawl a markdown or text file but it has to be a URL. This method is also useful for crawling local files.
   */
  async crawlFileOrMarkdown(
    resourceUrl: string | File,
  ): Promise<CrawledPage[]> {
    // Add the start URL to the queue
    const queueResource =
      typeof resourceUrl === 'string' ? resourceUrl : resourceUrl.name;
    const resourceType = typeof resourceUrl === 'string' ? 'web' : 'file';

    // Add the resource URL to the queue
    this.addToQueue(queueResource, resourceType);

    // While there are URLs in the queue and we haven't reached the maximum number of pages...
    while (this.shouldContinueCrawling()) {
      // Dequeue the next URL and depth
      const { sourceType, source, depth } = this.queue.shift()!;

      if (
        typeof resourceUrl === 'string' &&
        this.isValidSimpleFileUrlResource(resourceUrl)
      ) {
        // const content = await this.readTextOrMarkdownFileContent(file);
      }
    }

    return [];
  }

  /**
   * Reads the content of a simple text or markdown file and returns it as a string
   *
   * @param file
   * @returns The content of the file as a string
   *
   * @docs https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsText
   */
  async readTextOrMarkdownFileContent(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.readAsText(file);
    });
  }

  /**
   * Webpage crawler is designed to only process webpages that are HTML, TXT or Markdown
   */
  private isValidWebFileResource(url: string) {
    return isWebpage(url) || isTextUrl(url) || isMarkdownUrl(url);
  }

  private isValidSimpleFileUrlResource(url: string) {
    return isTextUrl(url) || isMarkdownUrl(url);
  }

  private isValidWebResource(url: string) {
    return isWebpage(url);
  }

  private isTooDeep(depth: number) {
    return depth > this.maxDepth;
  }

  private isUrlAlreadySeen(url: string) {
    const urlWithoutHash = this.getUrlWithoutHash(url);
    const urlWithoutQuery = this.getUrlWithoutQuery(urlWithoutHash);
    const urlWithoutSlash = urlWithoutQuery.replace(/\/$/, '');
    return this.seen.has(urlWithoutSlash);
  }

  private getUrlWithoutHash(url: string) {
    return url.split('#')[0];
  }

  private getUrlWithoutQuery(url: string) {
    return url.split('?')[0];
  }

  private shouldContinueCrawling() {
    return this.queue.length > 0 && this.pages.length < this.maxPages;
  }

  /**
   * Check if excluded by URL type and domain
   *
   * @param url
   * @returns boolean
   */
  private isUrlExcluded(url: string) {
    const urlParts = new URL(url);
    const urlPath = urlParts.pathname;
    // Remove www from host if it exists
    const urlDomain = urlParts.hostname.replace(/^www\./, '');
    // First check if the URL is excluded by type or domain
    const isExcludedByType = this.excludeUrlTypes.some((type) =>
      urlPath.endsWith(type),
    );
    // Next, check if the URL is excluded by domain
    const isExcludedByDomain = this.excludeUrlDomains.some((domain) =>
      urlDomain.includes(domain),
    );

    return isExcludedByType || isExcludedByDomain;
  }

  private addUrlToSeen(url: string) {
    const urlParts = new URL(url);
    const newUrl = `${urlParts.origin}${urlParts.pathname}`;
    this.seen.add(newUrl);
  }

  private addToQueue(
    title: QueueCrawledItem['title'],
    source: QueueCrawledItem['source'],
    sourceType: QueueCrawledItem['sourceType'] = 'web',
    depth: QueueCrawledItem['depth'] = 0,
  ) {
    this.queue.push({ title, sourceType, source, depth });
  }

  private addNewUrlsToQueue(
    urls: string[],
    depth: QueueCrawledItem['depth'],
    sourceType: SourceTypes = 'web',
  ) {
    // Check if the URL is excluded
    const okayUrls = urls.filter((url) => !this.isUrlExcluded(url));
    if (!okayUrls.length) return;

    // Filter out any URLs that are already in the queue
    const filteredUrls = okayUrls.filter((url) => {
      return !this.isUrlAlreadySeen(url);
    });
    // console.log(`filteredUrls`, filteredUrls);

    const uniqueUrls = Array.from(new Set(filteredUrls));

    // Push any unique URLs
    if (!uniqueUrls.length) return;

    this.queue.push(
      ...uniqueUrls.map((url) => ({
        title: url,
        source: url,
        depth: depth + 1,
        sourceType,
      })),
    );
  }

  /**
   * Fetch a standard web resource and return the content as a string
   *
   * @note - This method is used to fetch the content of a webpage, a simple text file, or a markdown file. For PDFs, use the `fetchWebPdfResource` method.
   *
   * @param url
   * @returns The content of the resource as a string
   */
  private async fetchWebResource(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const fetchedText = await response.text();
      return fetchedText;
    } catch (error) {
      console.error(`Failed to fetch ${url}: ${error}`);
      return '';
    }
  }

  private mapUrlFileExtensionToType(url: string) {
    const fileExtension = url.split('.').pop();
    switch (fileExtension) {
      case 'csv':
        return 'csv';
      case 'pdf':
        return 'pdf';
      case 'doc':
      case 'docx':
        return 'doc';
      default:
        return undefined;
    }
  }

  private getNonSimpleWebResourceApiUrl(
    type: NonSimpleResourceTypes,
    apiPrefix = '/api/pinecone/extract',
  ) {
    let apiUrl = '';
    switch (type) {
      case 'csv':
        apiUrl = `${apiPrefix}/csv`;
        break;
      case 'doc':
        apiUrl = `${apiPrefix}/word`;
        break;
      case 'pdf':
        apiUrl = `${apiPrefix}/pdf`;
        break;
      default:
      // Nothing to do
    }

    return apiUrl;
  }

  /**
   * Fetch a non-simple Web resource and return the content and relevant metadata.
   *
   * @note Non-simple web resources include PDFs, Word documents, etc. which may require special handling or the node.js runtime.
   *
   * @param url
   * @param type
   * @returns
   */
  private async fetchNonSimpleWebResource(url: string): Promise<{
    content: string;
    metadata: Omit<CrawledPage, 'content'>;
    error?: boolean;
    errorMsg?: string;
  }> {
    try {
      const baseUrl = getBaseUrl();
      const urlType = this.mapUrlFileExtensionToType(url);
      if (!urlType) {
        throw new Error(
          `Failed to map non-simple remote content: unknown type: ${url}`,
        );
      }
      const typeApiUrl = this.getNonSimpleWebResourceApiUrl(urlType);
      const apiUrl = new URL(typeApiUrl, baseUrl).href;
      const truncateBytesAmount = this.truncateBytesAmount;
      const fetchParams = {
        url,
        truncateBytesAmount,
        // Just extract the content, don't split it into pages
        // Let this crawler's `crawl` method handle the splitting in context with its main, contextual invocation
        splitContent: false,
      };
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify(fetchParams),
      });
      const data = (await response.json()) as ExtractedRemoteContentResponse;

      const pages = data.pages;

      // If the fetch failed, return an empty string
      if (!data.success || !pages.length) {
        const defaultErrMsg = 'Failed to fetch non-simple remote content';
        const errMsg = data.meta?.responseMsg || defaultErrMsg;
        const xErrMsg = `${defaultErrMsg} at ${url}: ${errMsg}`;
        console.error(xErrMsg);
        throw new Error(xErrMsg);
      }

      // First and subsequent pages all have common metadata
      const firstPage = pages[0];
      const pageMetadata: Omit<CrawledPage, 'content'> = {
        title: firstPage.title,
        documentName: firstPage.title,
        source: firstPage.source,
        sourceType: firstPage.sourceType,
        metadata: firstPage.metadata,
      };

      // String it all together
      const xContent = pages.map((doc) => doc.content).join('\n');
      return { content: xContent, metadata: pageMetadata };
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      console.error(
        `Failed to fetch non-simple Web resource ${url}: ${errorMsg}`,
      );
      return {
        content: '',
        metadata: {} as CrawledPage,
        error: true,
        errorMsg,
      };
    }
  }

  /**
   * Parse the HTML and return the content in Markdown format
   *
   * @param html - The HTML to parse
   * @param scope - A selector to limit the content to a specific part of the page
   * @returns The content in Markdown format
   */
  private parseHtml(html: string, scope?: string): ParsedTextResponse {
    let finalContent: string | null = null;
    let contentTitle: string | undefined;
    try {
      const $ = load(html);
      $('a').removeAttr('href');

      const scopeContent = scope && $(scope).html() ? $(scope).html() : null;
      finalContent = scopeContent ?? $.html();
      contentTitle = $('title').text() || '';
    } catch (error) {
      console.error(`Failed to parse HTML: ${error}`);
      return { content: '' };
    }

    return {
      title: contentTitle.trim(),
      content: NodeHtmlMarkdown.translate(finalContent!),
    };
  }

  /**
   * Parse simple text and return the content in Markdown format
   *
   * @param text - The string content to parse
   * @returns The content in Markdown format
   */
  private parseText(text: string, asMarkdown = true): ParsedTextResponse {
    try {
      return { content: asMarkdown ? NodeHtmlMarkdown.translate(text) : text };
    } catch (error) {
      console.error(`Failed to parse text: ${error}`);
      return { content: '' };
    }
  }

  /**
   * Parse markdown content.
   * @note - This is a convenience method that simply returns the content as is.
   */
  private parseMarkdown(content: string): ParsedTextResponse {
    const { grayMatter, content: modifiedContent } =
      parseGrayMatterAndModifyText(content);

    const title = grayMatter?.title || '';

    return { content: modifiedContent, title };
  }

  private extractUrls(html: string, baseUrl: string): string[] {
    const $ = load(html);
    const relativeUrls = $('a')
      .map((_, link) => $(link).attr('href'))
      .get() as string[];
    return relativeUrls.map(
      (relativeUrl) => new URL(relativeUrl, baseUrl).href,
    );
  }
}
