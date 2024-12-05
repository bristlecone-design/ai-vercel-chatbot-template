import { z } from 'zod';

/**
 * Local Governance Schemas
 */
export const localGovernanceInquiriesSchema = z.object({
  query: z
    .string()
    .describe(
      `A concise version of the user query combined with the topic and municipality lists as one query to retrieve context for inquiries around local governance. E.g "What time does the Reno Planning Commission meet?"`,
    ),
  translatedQuery: z
    .string()
    .describe(
      `Always provide a concise English version of a non-English user query to retrieve context for inquiries around local governance.`,
    ),
  municipality: z
    .array(z.string())
    .describe(
      `The municipality(ies) of the local governance to retrieve context for, e.g. Las Vegas, Reno, etc.`,
    ),
  topic: z
    .array(z.string())
    .describe(
      `The topic(s) of the local governance to retrieve context for, e.g. city council meetings, local ordinances, etc.`,
    ),
  queryingRequestNotice: z
    .string()
    .default('')
    .describe(
      `a succinct and contextual notification to the user when action is taken on their query. For example, you might say: "Looking up information on this {query topic} for you..." where {query topic} is replaced with the topic relating to the user's inquiry.`,
    ),
  analyzingRequestNotice: z
    .string()
    .default('Analyzing info...')
    .describe(
      `a succinct and contextual notification to the user when analyzing contextual info found based on their query. For example, you might say: "Analyzing info on {query topic}..." where {query topic} is replaced with the topic relating to the user's inquiry.`,
    ),
});

export type LocalGovernanceInquiriesType = z.infer<
  typeof localGovernanceInquiriesSchema
>;
