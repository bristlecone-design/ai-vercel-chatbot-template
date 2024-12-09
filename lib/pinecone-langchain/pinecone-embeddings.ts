import { OpenAIEmbeddings } from '@langchain/openai';
import type { Document } from '@pinecone-database/doc-splitter';
import type { PineconeRecord } from '@pinecone-database/pinecone';
import md5 from 'md5';

import type { INSERT_DOC_DEFAULT_TYPES } from './defaults';
import type { BASE_RECORD_PINECONE } from './metadata';

import { DEFAULT_EMBEDDING_MODEL } from '@/constants/chat-defaults';

/**
 * Create an embedding for a question or other content and return its vector.
 */
export async function createContentEmbedding(
  contentToEmbed: string,
  modelName: INSERT_DOC_DEFAULT_TYPES['modelName'] = DEFAULT_EMBEDDING_MODEL,
) {
  const queryEmbedding = await new OpenAIEmbeddings({
    modelName,
  }).embedQuery(contentToEmbed);

  return queryEmbedding;
}

/**
 * Embed a document and map it to a Pinecone record for ingestion into Pinecone or other systems/context usage.
 *
 * @param doc - The document to embed
 * @returns The Pinecone record
 */
export async function embedDocument(
  doc: Document,
): Promise<PineconeRecord | BASE_RECORD_PINECONE> {
  try {
    // The pageContent can be very long or a split of the original content
    const pageContent = doc.pageContent.replaceAll(/\n/g, ' ');
    const description = ''; // doc.metadata.description || '';
    const embeddedText = description
      ? `Text: ${pageContent}\n\nText Summary: ${description}`
      : pageContent;

    // Generate OpenAI embeddings for the document content
    // @note - we sanitize the embedding content by removing newlines
    const embedding = await createContentEmbedding(embeddedText);

    // Create a hash of the document content
    const hash = md5(pageContent);

    // Return the vector embedding object
    return {
      id: hash, // The ID of the vector is the hash of the document content
      values: embedding, // The vector values are the OpenAI embeddings
      metadata: {
        ...doc.metadata,
        // The metadata includes details about the document
        title: doc.metadata.title as string, // The title of the document
        content: pageContent, // The chunk/full text that the vector represents
        fullContent: (doc.metadata.fullContent ||
          doc.metadata.content) as string, // The full text of the document
        source: doc.metadata.source as string, // The source type of the document
        hash: doc.metadata.hash as string, // The hash of the current or parent document content
      },
    } as BASE_RECORD_PINECONE;
  } catch (error) {
    console.log('Error embedding document: ', error);
    throw error;
  }
}
