import type { RecordMetadata } from '@pinecone-database/pinecone';

/**
 * Takes a Pinecone record's metadata object and returns a new object ensuring any keys of type object are stringified to honor the Pinecone metadata schema of @RecordMetadataValue
 *
 * @param metadata - The metadata object to map
 * @returns The mapped metadata object
 */
export function mapPineconeRecordMetadataValues(
  metadata: Record<string, any>,
): RecordMetadata {
  return Object.keys(metadata).reduce((acc, key) => {
    if (metadata[key] && typeof metadata[key] === 'object') {
      acc[key] = JSON.stringify(metadata[key]);
    } else {
      acc[key] = metadata[key];
    }
    return acc;
  }, {} as RecordMetadata);
}
