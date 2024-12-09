/**
 * Standard gray matter metadata for MDX files
 */
export type MDX_METADATA = {
  title: string;
  description?: string;
  summary?: string;
  date?: string;
  tags?: string[];
  authors?: string[];
  [key: string]: any;
};

export type ParsedGrayMatterTextResult = {
  grayMatter?: MDX_METADATA;
  content: string;
};

/**
 * Parse the gray matter section of an MDX file and return the metadata and the content as separate values to be used in the application
 *
 * @param content
 * @returns object with the gray matter metadata and the content as separate keys
 */
export function parseGrayMatterAndModifyText(
  content: string,
): ParsedGrayMatterTextResult {
  // Regular expression to extract the gray matter section
  const grayMatterRegex = /---\n([\s\S]+?)\n---\n/;
  const match = content.match(grayMatterRegex);

  if (!match) {
    return { content };
  }

  // Extracted gray matter content
  const grayMatterContent = match[1];

  // Split into lines and then parse each line
  const lines = grayMatterContent.split('\n');
  const grayMatter: Record<string, string> = {};

  for (const line of lines) {
    const [key, value] = line.split(':').map((part) => part.trim());
    // Assuming values are always strings; you might need additional parsing for other types
    grayMatter[key] = value.replace(/^'(.*)'$/, '$1'); // Remove surrounding single quotes if present
  }

  // Remove the gray matter section from the original content
  const modifiedContent = content.replace(grayMatterRegex, '');

  return { grayMatter, content: modifiedContent } as ParsedGrayMatterTextResult;
}

// Example usage
// const content =
//   "---\ntitle: '2023 Blog Refresh'\npublishedAt: '2023-11-19'\nsummary: 'Including some of my latest hot takes (okay they are pretty mild).'\n---\n\nI updated my blog this weekend and wanted to share some thoughts along the way:\n\n- [Content Management](#content-management)\n- [Performance](#performance)\n- [Opinions](#opinions)\n\n<Callout emoji=\"⚠️\">\n\n**Disclaimer:** My site is my “breakable toy”. I enjoy and _intentionally_ change technology and try new patterns here. I'd encourage you to do the same and then write about why you made those choices.\n\n</Callout>\n\n## Content Management\n\nI've moved my content from HTML to vanilla Markdown, to MDX, to a CMS, and back to MDX over the years. My content requirements as of now are:\n\n1. Written in Markdown¹\n2. Support for syntax highlighting, embedded tweets, and other components\n3. Managed through version control²\n4. Minimal external depende";
// const { grayMatter, content: modifiedContent } =
//   parseGrayMatterAndModifyText(content);
// console.log(grayMatter);
// console.log(modifiedContent);
