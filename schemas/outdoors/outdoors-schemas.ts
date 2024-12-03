import { z } from 'zod';

/**
 * Outdoor recreation inquiries
 */
export const outdoorRecreationInquiriesSchema = z.object({
  query: z
    .string()
    .describe(
      `A concise version of the user query combined with the activity and municipality lists as one query to retrieve context for inquiries around outdoor recreation.`,
    ),
  translatedQuery: z
    .string()
    .describe(
      `Always provide a concise English version of a non-English user query to retrieve context for inquiries around outdoor recreation.`,
    ),
  activity: z
    .array(z.string())
    .describe(
      `The inferred activity(ies) of the inquiry to retrieve context for, e.g. hiking, camping, fishing, star gazing, etc.`,
    ),
  municipality: z
    .array(z.string())
    .describe(
      `The municipality(ies) of the query to retrieve context for, e.g. Las Vegas, Reno, Tonopah, etc.`,
    ),
  queryingRequestNotice: z
    .string()
    .default('')
    .describe(
      `A succinct and contextual text notification for the user when action is taken on their query. Text is in user's original language. For example, you might say: "Looking up information on this {query topic} for you..." where {query topic} is replaced with the topic relating to the user's inquiry.`,
    ),
  analyzingRequestNotice: z
    .string()
    .default('Analyzing...')
    .describe(
      `A succinct and contextual text notification for the user when analyzing contextual info found based on their query. Text is in user's original language. For example, you might say: "Analyzing  {query topic}..." where {query topic} is replaced with the topic relating to the user's inquiry.`,
    ),
});

export type OutdoorRecreationInquiriesType = z.infer<
  typeof outdoorRecreationInquiriesSchema
>;
