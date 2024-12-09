import { NodeHtmlMarkdown } from 'node-html-markdown';

import {
  type ParsedHtmlResponse,
  parseHtml as htmlParser,
} from '../html/parse-html';

/**
 * Response from the HTML to Markdown conversion
 *
 * @note Requires the nodejs runtime
 *
 */

export interface HtmlToMarkdownResponse extends ParsedHtmlResponse {
  translated: boolean;
}

/**
 * Retrieve the text content from the HTML then convert it to markdown
 *
 * @param html - The HTML to parse as text
 * @param selector - The selector to scope the content
 *
 * @returns The text content and other metadata
 */
export function htmlToMarkdown(
  html: string,
  selector?: string,
): HtmlToMarkdownResponse {
  try {
    const parsedHtml = htmlParser(html, selector);
    if (parsedHtml.content) {
      const {
        content: finalContent,
        title: contentTitle,
        description: contentDescription,
      } = parsedHtml;
      const htmlMarkdown = NodeHtmlMarkdown.translate(finalContent);

      return {
        title: contentTitle?.trim(),
        content: htmlMarkdown,
        description: contentDescription,
        translated: true,
      };
    }

    return { content: '', title: '', translated: false };
  } catch (error) {
    console.error(`Failed to parse HTML: ${error}`);
    return { content: '', title: '', translated: false };
  }
}

export interface StringToMarkdownResponse {
  content: string;
  translated: boolean;
}

/**
 * Parse string content to markdown
 *
 * @param content - The content to parse
 *
 * @returns The parsed content as markdown
 */
export function stringToMarkdown(content: string): StringToMarkdownResponse {
  try {
    const xContent = NodeHtmlMarkdown.translate(content);
    return { content: xContent, translated: true };
  } catch (error) {
    console.error(`Failed to parse string to markdown: ${error}`);
    return { content: '', translated: false };
  }
}
