import { OpenAI, OpenAIEmbeddings } from '@langchain/openai';
import {
  type Index,
  Pinecone,
  type PineconeRecord,
  type QueryResponse,
} from '@pinecone-database/pinecone';
import { loadQAStuffChain } from 'langchain/chains';
import { Document } from 'langchain/document';

import { getErrorMessage } from '@/lib/errors';
import { sleep } from '@/lib/utils';

import {
  INSERT_DOC_DEFAULTS,
  type INSERT_DOC_DEFAULT_TYPES,
  QUERY_DOC_CONTENT_DEFAULTS,
  type QUERY_DOC_CONTENT_TYPES,
} from './defaults';
import type { BASE_RECORD_METADATA, BASE_RECORD_SOURCE } from './metadata';
import { createContentEmbedding } from './pinecone-embeddings';
import { DEFAULT_INDEX_VALS } from './pinecone-seed-web-url';
import { pineconeBaseTextSplitter } from './pinecone-splitters';
import { mapPineconeRecordMetadataValues } from './pinecone-utils';

import {
  CHATGPT_3_5_TURBO,
  DEFAULT_EMBEDDING_DIMENSIONS,
  DEFAULT_EMBEDDING_MODEL,
} from '@/constants/chat-defaults';

/**
 * Pinecone and LLM utilities.
 *
 * For Q&A RAG (Retrieval-Augmented Generation) with Pinecone and Langchain Recipes, see the official documentation:
 * @see https://js.langchain.com/docs/use_cases/question_answering/quickstart
 *
 * For more about chains, see the official documentation:
 * @see https://js.langchain.com/docs/modules/chains/
 *
 * For multiple questions in a single request, see the official documentation:
 * @see https://js.langchain.com/docs/use_cases/query_analysis/how_to/few_shot#query-generation
 *
 * For general LLM and prompt concepts and partial prompts, see the official documentation:
 * @see https://js.langchain.com/docs/modules/model_io/concepts
 * @see https://js.langchain.com/docs/modules/model_io/prompts/
 * @see https://js.langchain.com/docs/modules/model_io/prompts/pipeline
 * @see https://js.langchain.com/docs/modules/model_io/prompts/few_shot#few-shotting-with-functions
 * @see https://js.langchain.com/docs/modules/model_io/llms/quick_start
 * @see https://js.langchain.com/docs/modules/model_io/llms/streaming_llm
 *
 *
 * For caching with LLM, see the official documentation:
 * @see https://js.langchain.com/docs/modules/model_io/llms/llm_caching
 *
 * For canceling LLM requests, see the official documentation:
 * @see https://js.langchain.com/docs/modules/model_io/llms/cancelling_requests
 *
 * For subscribing to LLM events and custom logging, see the official documentation:
 * @see https://js.langchain.com/docs/modules/model_io/llms/subscribing_events
 *
 * For adding a timeout to LLM requests, see the official documentation:
 * @see https://js.langchain.com/docs/modules/model_io/llms/timeouts
 *
 * For more information on Pinecone vector store, see the official documentation:
 * @see https://js.langchain.com/docs/integrations/vectorstores/pinecone#maximal-marginal-relevance-search
 *
 * For general Prompt + LLM usage, including function calls with Langchain, see the official documentation:
 * @see https://js.langchain.com/docs/expression_language/cookbook/prompt_llm_parser
 * @see https://scrimba.com/scrim/cof5449f5bc972f8c90be6a82
 *
 * For the standard LLEL (Langchain Language Expression Language) interface, see the official documentation:
 * @see https://js.langchain.com/docs/expression_language/interface
 *
 * For RAG (Retrieval-Augmented Generation) with Pinecone and Langchain, see the official documentation:
 * @see https://js.langchain.com/docs/expression_language/cookbook/retrieval
 * @see https://js.langchain.com/docs/modules/data_connection/retrievers/similarity-score-threshold-retriever
 * @see https://js.langchain.com/docs/modules/data_connection/retrievers/multi-query-retriever
 * @see https://js.langchain.com/docs/modules/data_connection/retrievers/self_query/
 * @see https://js.langchain.com/docs/modules/data_connection/retrievers/parent-document-retriever
 *
 * @see https://js.langchain.com/docs/modules/data_connection/document_transformers/
 * @see https://js.langchain.com/docs/modules/data_connection/document_transformers/#types-of-text-splitters
 * @see https://js.langchain.com/docs/modules/data_connection/
 * @see https://js.langchain.com/docs/modules/data_connection/document_loaders/
 * @see https://js.langchain.com/docs/modules/data_connection/document_loaders/creating_documents
 * @see https://js.langchain.com/docs/modules/data_connection/document_loaders/csv
 * @see https://js.langchain.com/docs/modules/data_connection/document_loaders/file_directory
 * @see https://js.langchain.com/docs/modules/data_connection/document_loaders/pdf
 *
 * Custom PDF loader
 * @see https://github.com/chroma-core/gpt4-pdf-chatbot-langchain-chroma/blob/main/utils/customPDFLoader.ts
 *
 * For multiple chains, see the official documentation:
 * @see https://js.langchain.com/docs/expression_language/cookbook/multiple_chains
 *
 * For adding memory to the LLM model, see the official documentation:
 * @see https://js.langchain.com/docs/expression_language/cookbook/adding_memory
 *
 * @note When using Vercel's AI SDK and Langchain, check out the examples here https://sdk.vercel.ai/docs/guides/providers/langchain
 */

/**
 * Create a Pinecone index.
 */
export async function createPineconeIndex(
  client: Pinecone,
  indexName: string,
  vectorDimension: number = DEFAULT_EMBEDDING_DIMENSIONS,
): Promise<{
  created: boolean;
  error: boolean;
  index: Index | null;
}> {
  let created = false;
  let error = false;
  let index: Index | null = null;
  try {
    console.log(`Creating Pinecone index "${indexName}"...`);
    // 1. Initiate index existence check
    console.log(`Checking "${indexName}"...`);
    // 2. Get list of existing indexes
    const indexList = (await client.listIndexes()).indexes || [];
    // 3. If index doesn't exist, create it
    const indexExists = indexList.some((index) => index.name === indexName);
    if (!indexExists) {
      // 4. Log index creation initiation
      console.log(`Creating "${indexName}"...`);
      // 5. Create index
      console.log(
        `Creating index.... please wait for it to finish initializing.`,
      );

      const createRes = await client.createIndex({
        ...DEFAULT_INDEX_VALS,
        dimension: vectorDimension,
        name: indexName,
        waitUntilReady: true,
      });

      // Wait for the index to be ready
      await sleep(2500);

      // 6. Log successful creation
      console.log(`Index "${indexName}" created.`);
      created = true;
      index = client.index(indexName);
    } else {
      // 8. Log if index already exists
      console.log(`"${indexName}" already exists.`);
      index = client.index(indexName);
    }
  } catch (e) {
    const errMsg = getErrorMessage(e);
    console.error('error creating index', errMsg);
    error = true;
  }

  return { created, error, index };
}

/**
 * Insert a single document into the Pinecone index.
 *
 * @param index - The Pinecone index to insert the document into.
 * @param doc - The document to insert.
 * @returns A boolean indicating whether the insertion was successful.
 *
 * @see https://docs.pinecone.io/docs/upsert-data
 * @see https://docs.pinecone.io/docs/manage-rag-documents
 *
 * @note A document is instanced as a `Document` object from `langchain/document`. E.g.
 *  const doc = new Document({
 *    pageContent: documentText,
 *    metadata: {documentName: name},
 *  });
 */

export const insertSingleDocument = async (
  index: Index,
  doc: Document,
  namespace?: string,
  metadata?: BASE_RECORD_METADATA,
  options: Partial<INSERT_DOC_DEFAULT_TYPES> = {},
): Promise<{
  success: boolean;
  batch: PineconeRecord[];
  msg?: string;
}> => {
  options = { ...INSERT_DOC_DEFAULTS, ...options };
  const {
    batchSize,
    chunkSize,
    chunkOverlap,
    dryrun,
    modelName,
    splitterMethod,
  } = options as INSERT_DOC_DEFAULT_TYPES;

  const batch: PineconeRecord[] = [];

  try {
    const text = doc.pageContent;
    const docMetadata = doc.metadata;
    const pageNumber = docMetadata.loc?.pageNumber ?? undefined;
    const documentSource = docMetadata.source || docMetadata.src;
    const documentDescriptor = docMetadata.description;
    let documentName = docMetadata.documentName;

    // Let's derive the document name from the source if it's not provided
    // This assumes the source is a URL or a file path
    if (!documentName) {
      documentName = documentSource.split('/').pop() || 'unknown';
    }

    const textSplitter = pineconeBaseTextSplitter(
      splitterMethod,
      chunkSize,
      chunkOverlap,
    );

    const chunks = await textSplitter.createDocuments([text]);

    let embeddingsArrays: number[][] = [];
    if (!dryrun) {
      embeddingsArrays = await new OpenAIEmbeddings({
        modelName,
      }).embedDocuments(
        chunks.map((chunk) => {
          const content = chunk.pageContent.replace(/\n/g, ' ');
          const description = documentDescriptor || chunk.metadata.description;
          const finalString = description
            ? `${description} ${content}`
            : content;

          return finalString;
        }),
      );
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      if (!chunk.pageContent.trim()) {
        continue;
      }

      let chunkLocation = chunk.metadata.loc || {};
      if (pageNumber) {
        chunkLocation = { ...chunkLocation, pageNumber };
      }
      const vector = {
        // @note use the documentName and the index of the chunk to create a unique id for the vector, e.g. https://docs.pinecone.io/docs/manage-rag-documents#use-id-prefixes-to-reference-parent-documents
        id: `${documentName}_${i}`,
        values: dryrun ? [] : embeddingsArrays[i],
        metadata: mapPineconeRecordMetadataValues({
          ...metadata,
          ...chunk.metadata,
          source: documentSource, // The source of the document
          loc: JSON.stringify(chunkLocation), // The location of the embedded text in the original document
          content: chunk.pageContent, // The embedded text
          title: metadata?.title ?? documentName, // The title of the document
          documentName, // The name of the document
        }),
      };

      batch.push(vector);

      // Don't upsert if dryrun is true
      if (dryrun) {
        continue;
      }

      if (batch.length === batchSize || i === chunks.length - 1) {
        try {
          const ops = namespace ? index.namespace(namespace) : index;
          const res = await ops.upsert(batch);
        } catch (e) {
          const errMsg = getErrorMessage(e);
          console.error('error upserting vectors', e);
          return { success: false, batch, msg: errMsg };
        }

        // batch = [];
        continue;
      }
    }
  } catch (e) {
    const errMsg = getErrorMessage(e);
    console.error('error inserting document', errMsg);
    return { success: false, batch, msg: errMsg };
  }

  return {
    success: true,
    batch,
    msg: dryrun
      ? `Batches NOT upserted since we're in dryrun mode`
      : 'Batch upserted',
  };
};

export type DOC_INSERT_RESULT = {
  success: boolean;
  [key: string]: any;
};

export type INSERT_MULTIPLE_DOCS_RESULT = {
  created: boolean;
  error: boolean;
  msg?: string;
  results: DOC_INSERT_RESULT[];
};

/**
 * Insert multiple documents into the Pinecone index.
 */
export async function insertMultipleDocuments(
  documents: Document[],
  indexName: string,
  index?: Index | null,
  namespace?: string,
  metadata?: BASE_RECORD_METADATA,
  options: Partial<INSERT_DOC_DEFAULT_TYPES> = {},
): Promise<INSERT_MULTIPLE_DOCS_RESULT> {
  options = { ...INSERT_DOC_DEFAULTS, ...options };
  const { batchSize, chunkSize, modelName, dryrun } =
    options as INSERT_DOC_DEFAULT_TYPES;

  const results: DOC_INSERT_RESULT[] = [];

  try {
    // 1. Create a Pinecone index if it doesn't exist
    index = index || new Pinecone().Index(indexName || DEFAULT_INDEX_VALS.name);

    // 2. Insert each document
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      if (doc.pageContent.trim() === '') {
        continue;
      }
      const res = await insertSingleDocument(index, doc, namespace, metadata, {
        batchSize,
        chunkSize,
        modelName,
        dryrun,
      });
      results.push({
        success: res.success,
        ...doc.metadata,
      });
    }
  } catch (e) {
    const errMsg = getErrorMessage(e);
    console.error('error inserting multiple documents', errMsg);
    return {
      created: false,
      error: true,
      msg: errMsg,
      results,
    };
  }

  // 3. Return final results - #tada!
  return {
    created: true,
    error: false,
    results,
  };
}

/**
 * Get matches from Pinecone based on a set of embeddings.
 *
 * @usage Use this function to query a Pinecone index for documents related to a specific question's embeddings.
 */
export async function getMatchesFromEmbeddings(
  embeddings: number[],
  topK: number,
  index: Index,
  namespace?: string,
  options: Partial<QUERY_DOC_CONTENT_TYPES> = {},
) {
  try {
    options = { ...QUERY_DOC_CONTENT_DEFAULTS, ...options };
    const { includeMetadata, includeValues } =
      options as QUERY_DOC_CONTENT_TYPES;

    topK = topK || options.topK || 10;

    const opts = index && namespace ? index.namespace(namespace) : index;
    const queryResult = await opts.query({
      vector: embeddings,
      topK,
      includeMetadata,
      includeValues,
    });
    return queryResult.matches || [];
  } catch (e) {
    console.log('Error querying embeddings: ', e);
    throw new Error(`Error querying embeddings: ${e}`);
  }
}

/**
 * Query a Pinecone inde and its namespace for documents related to a specific question.
 */
export async function queryPineconeNamespace(
  question: string,
  index: Index,
  namespace: string,
  embeddings?: number[],
  options: Partial<QUERY_DOC_CONTENT_TYPES> = {},
) {
  options = { ...QUERY_DOC_CONTENT_DEFAULTS, ...options };
  const { topK, filter, includeMetadata, includeValues } =
    options as QUERY_DOC_CONTENT_TYPES;

  let queryResponse = null;

  try {
    const queryEmbedding = embeddings?.length
      ? embeddings
      : await createContentEmbedding(question);

    const pineconeNamespace = index.namespace(namespace);

    queryResponse = await pineconeNamespace.query({
      topK,
      vector: queryEmbedding,
      includeMetadata,
      includeValues,
      filter,
    });
  } catch (e) {
    const errMsg = getErrorMessage(e);
    console.error('error querying pinecone namespace', errMsg);
    return null;
  }

  return queryResponse;
}

/**
 * Query a Pinecone index for documents related to a specific question.
 *
 * @note This creates an embedding for the question and queries the index for related documents.
 *
 */
export async function queryPineconeContent(
  question: string,
  index: Index,
  options: Partial<QUERY_DOC_CONTENT_TYPES> = {},
) {
  options = { ...QUERY_DOC_CONTENT_DEFAULTS, ...options };
  const { topK, filter, includeMetadata, includeValues } =
    options as QUERY_DOC_CONTENT_TYPES;

  let queryResponse = null;

  try {
    const queryEmbedding = await createContentEmbedding(question);

    queryResponse = await index.query({
      topK,
      vector: queryEmbedding,
      includeMetadata,
      includeValues,
      filter,
    });
  } catch (e) {
    const errMsg = getErrorMessage(e);
    console.error('error querying pinecone', errMsg);
    return null;
  }

  return queryResponse;
}

/**
 * Query a Pinecone index for a specific document by name.
 *
 * @note wraps `queryPineconeContent` with a filter for the document name.
 */
export async function queryPineconeContentDocument(
  question: string,
  index: Index,
  documentName: string,
  opts: Partial<QUERY_DOC_CONTENT_TYPES> = {},
) {
  opts = { ...QUERY_DOC_CONTENT_DEFAULTS, ...opts } as QUERY_DOC_CONTENT_TYPES;

  const queryEmbedding = await new OpenAIEmbeddings({
    modelName: DEFAULT_EMBEDDING_MODEL,
  }).embedQuery(question);

  // Core query options
  const queryOpts = {
    ...opts,
    vector: queryEmbedding,
    filter: { documentName: { $eq: documentName } },
  } as QUERY_DOC_CONTENT_TYPES;

  const queryResponse = await index.query({
    ...queryOpts,
  });

  return queryResponse;
}

export type LLMResponse = {
  result: any;
  text: string;
  sources: BASE_RECORD_SOURCE[];
};

export type QUERY_LLM_OPT_TYPES = {
  modelName?: string;
  temperature?: number;
};

export const QUERY_LLM_OPTS = {
  modelName: CHATGPT_3_5_TURBO,
  temperature: 0.3,
} as QUERY_LLM_OPT_TYPES;

/**
 * Query an LLM model based on a Pinecone index query response.
 *
 * @note This concatenates the page content from the query response and queries the LLM model with the question.
 * @note Sequence of operations:
 *
 *  1. The response from `queryPineconeContent` is used to call `queryLLM` with the question.
 *
 *  2. The `queryLLM` function concatenates the page content from the query response and queries the LLM model with the question.
 *
 *  3. The result is returned as an `LLMResponse` object.
 *
 */
export async function queryLLM(
  question: string,
  queryResponse: QueryResponse,
  options: Partial<QUERY_LLM_OPT_TYPES> = {},
): Promise<LLMResponse | null> {
  options = { ...QUERY_LLM_OPTS, ...options };
  const { modelName, temperature } = options as QUERY_LLM_OPT_TYPES;

  let result = null;
  try {
    const llm = new OpenAI({
      modelName,
      temperature,
      streaming: false,
    });
    const chain = loadQAStuffChain(llm);

    const concatenatedPageContent = queryResponse.matches
      .map((match: any) => match.metadata.pageContent)
      .join('');

    result = await chain.invoke({
      input_documents: [new Document({ pageContent: concatenatedPageContent })],
      question,
    });
  } catch (e) {
    const errMsg = getErrorMessage(e);
    console.error('error querying LLM', errMsg);
    return null;
  }

  return {
    result,
    text: result.text,
    // @ts-ignore
    sources: queryResponse.matches.map((x) => {
      return {
        id: x.id,
        score: x.score,
        pageContent: x.metadata?.pageContent,
        metadata: {
          ...(x.metadata || {}),
        },
      };
    }),
  };
}

/**
 * Query indexed Pinecone content based on a user's question and return a response from the LLM model.
 *
 * @inspiration https://github.com/dbabbs/semantic-search-openai-nextjs-sample/blob/master/src/ai-util.ts
 */
export async function queryPineconeAndLLM(
  question: string,
  indexName = '',
  docName?: string,
  options: Partial<QUERY_DOC_CONTENT_TYPES> = {},
  llmOptions: Partial<QUERY_LLM_OPT_TYPES> = {},
): Promise<LLMResponse | null> {
  const pinecone = new Pinecone();
  const index = pinecone.Index(indexName);

  const queryResponse = await (docName
    ? queryPineconeContentDocument(question, index, docName, options)
    : queryPineconeContent(question, index, options));

  if (!queryResponse) {
    return null;
  }

  const llmResponse = await queryLLM(question, queryResponse, llmOptions);
  return llmResponse;
}

// export const queryPineconeVectorStoreAndQueryLLM = async (
//   question: string,
//   indexName: string
// ) => {
//   // 1. Start query process
//   const pinecone = new Pinecone();
//   console.log('Querying Pinecone vector store...');
//   // 2. Retrieve the Pinecone index
//   const index = pinecone.index(indexName);
//   // 3. Create query embedding
//   const queryEmbedding = await new OpenAIEmbeddings({
//     modelName: 'text-embedding-ada-002',
//   }).embedQuery(question);
//   // console.log(`queryEmbedding`, queryEmbedding);
//   // 4. Query Pinecone index and return top 10 matches
//   let queryResponse = await index.query({
//     topK: 10,
//     vector: queryEmbedding,
//     includeMetadata: true,
//     includeValues: true,
//   });
//   console.log(`queryResponse`, queryResponse);
//   // 5. Log the number of matches
//   console.log(`Found ${queryResponse.matches.length} matches...`);
//   // 6. Log the question being asked
//   console.log(`Asking question: ${question}...`);
//   if (queryResponse.matches.length) {
//     // 7. Create an OpenAI instance and load the QAStuffChain
//     const llm = new OpenAI({
//       modelName: 'gpt-3.5-turbo',
//     });
//     const chain = loadQAStuffChain(llm);
//     // 8. Extract and concatenate page content from matched documents
//     const concatenatedPageContent = queryResponse.matches
//       .map((match) => match.metadata.pageContent)
//       .join(' ');
//     // 9. Execute the chain with input documents and question
//     const result = await chain.call({
//       input_documents: [new Document({ pageContent: concatenatedPageContent })],
//       question: question,
//     });
//     // 10. Log the answer
//     console.log(`Answer: ${result.text}`);
//     return result.text;
//   } else {
//     // 11. Log that there are no matches, so GPT-3 will not be queried
//     console.log('Since there are no matches, GPT-3 will not be queried.');
//   }
// };
