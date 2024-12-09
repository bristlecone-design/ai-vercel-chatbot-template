import { type CreateIndexOptions, Pinecone } from '@pinecone-database/pinecone';

import { chunkedUpsert } from './chunkedUpsert';
import { Crawler, DEFAULT_MAX_DEPTH, DEFAULT_MAX_PAGES } from './crawler';
import {
  DEFAULT_CHUNKED_UPSERT_SIZE,
  DEFAULT_TRUNCATE_BYTES_AMOUNT,
  INSERT_DOC_DEFAULTS,
} from './defaults';
import type {
  ContentUrlItem,
  CrawledPage,
  CrawledPageSourceInput,
  SourceTypes,
} from './metadata';
import { embedDocument } from './pinecone-embeddings';
import { createPineconeIndex } from './pinecone-llm';
import type { SplitterMethod, SplitterOptions } from './pinecone-splitters';
import { prepareDocument } from './prepare-document';

import {
  DEFAULT_EMBEDDING_DIMENSIONS,
  DEFAULT_EMBEDDING_METRIC,
} from '@/constants/chat-defaults';

export interface SeedOptions {
  splitterMethod: SplitterMethod;
  chunkedUpsertSize: number;
  chunkOverlap: SplitterOptions['chunkOverlap'];
  chunkSize: SplitterOptions['chunkSize'];
}

// https://www.pinecone.io/learn/chunking-strategies/
export const DEFAULT_SEED_OPTIONS: SeedOptions = {
  splitterMethod: 'recursive',
  chunkSize: INSERT_DOC_DEFAULTS.chunkSize,
  chunkedUpsertSize: DEFAULT_CHUNKED_UPSERT_SIZE,
  chunkOverlap: INSERT_DOC_DEFAULTS.chunkOverlap,
};

export const DEFAULT_INDEX_VALS = {
  name: 'general',
  dimension: DEFAULT_EMBEDDING_DIMENSIONS,
  metric: DEFAULT_EMBEDDING_METRIC,
  waitUntilReady: true,
  spec: {
    serverless: {
      cloud: 'aws',
      region: 'us-west-2',
    },
  },
} as CreateIndexOptions;

export type SeedUrlItem = ContentUrlItem & {};

export type SeedUrlProps = {
  url: CrawledPage['source'];
  title?: CrawledPage['title'];
  limit: number;
  maxDepth?: number;
  indexName: string;
  namespace?: string;
  seed: SeedOptions;
  source?: SourceTypes;
  scope?: string; // cheerio content scope (selector)
};

export type SeedUrlHandlerOpts = Pick<
  SeedUrlProps,
  'limit' | 'maxDepth' | 'indexName' | 'namespace' | 'seed' | 'source' | 'scope'
> & {
  metadata?: Record<string, any>;
  // partnerMeta?: MetadataPartnerData;
};

export type SeedUrlHandlerParams = {
  url: CrawledPageSourceInput;
  title?: string;
  opts?: SeedUrlHandlerOpts;
};

export async function seedUrl(
  url: SeedUrlHandlerParams['url'],
  title: SeedUrlHandlerParams['title'],
  opts = {} as SeedUrlHandlerParams['opts'],
) {
  try {
    // Initialize the Pinecone client
    const pinecone = new Pinecone();

    // Destructure the options object
    const {
      scope,
      source: sourceType = 'web',
      maxDepth = DEFAULT_MAX_DEPTH,
      limit: maxPages = DEFAULT_MAX_PAGES,
      indexName: indexNameProp,
      namespace: namespaceProp,
      seed = { ...DEFAULT_SEED_OPTIONS },
      metadata,
    } = opts || {};

    // Create a new Crawler with depth 1 and maximum pages as limit
    const crawler = new Crawler({ maxDepth, maxPages: maxPages });

    // Crawl the given URL and get the pages
    const pages = (await crawler.crawl(
      url,
      sourceType,
      title,
      scope,
    )) as CrawledPage[];

    // Prepare documents by splitting the pages
    // @note - @prepareDocument has a default set of options for text splitting and truncation.
    const { splitterMethod, chunkSize, chunkedUpsertSize, chunkOverlap } = seed;

    const documents = await Promise.all(
      pages.map((page) =>
        prepareDocument(page, {
          truncateBytesAmount: DEFAULT_TRUNCATE_BYTES_AMOUNT,
          splitContent: true,
          splitterMethod,
          chunkSize,
          chunkOverlap,
          metadata,
        }),
      ),
    );

    const indexName = indexNameProp || process.env.PINECONE_INDEX!;
    const namespace = namespaceProp || '';

    // Create Pinecone index if it does not exist
    const { index, created, error } = await createPineconeIndex(
      pinecone,
      indexName,
    );

    if (!created) {
      console.log(`Index ${indexName} already exists`);
    } else if (error) {
      console.error(`Error creating index ${indexName}:`, error);
      throw error;
    }
    // NOTE: This is a potential optimization for large datasets
    // Split the docs into batches and upsert them into the Pinecone index
    // Batch size
    // const batchSize = 10;
    // for (let i = 0; i < documents.length; i += batchSize) {
    //   const batch = documents.slice(i, i + batchSize);
    //   // Get the vector embeddings for the documents
    //   const vectors = await Promise.all(batch.flat().map(embedDocument));
    //   // Upsert vectors into the Pinecone index
    //   await chunkedUpsert(index!, vectors, "", 10);
    // }

    // Get the vector embeddings for the documents
    const vectors = await Promise.all(documents.flat().map(embedDocument));

    // Upsert vectors into the Pinecone index
    const upsertRes = await chunkedUpsert(
      index!,
      vectors,
      chunkedUpsertSize,
      namespace,
    );

    // Return the first document
    return documents[0];
  } catch (error) {
    console.error('Error seeding:', error);
    throw error;
  }
}
