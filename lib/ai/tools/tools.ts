import { discoverToolDefinition } from './tool-discover';

/**
 * Define the platform tool set
 *
 * @see https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling#types
 */

export const platformToolSet = {
  discover: discoverToolDefinition,
};

// type MyToolCall = CoreToolCallUnion<typeof platformToolSet>;
// type MyToolResult = CoreToolResultUnion<typeof platformToolSet>;
