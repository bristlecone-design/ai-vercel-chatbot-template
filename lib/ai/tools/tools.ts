import type { CoreToolCallUnion, CoreToolResultUnion } from 'ai';
import { discoverToolDefinition } from './tool-discover';

export const platformToolSet = {
  discover: discoverToolDefinition,
};

type MyToolCall = ReturnType<CoreToolCallUnion<typeof platformToolSet>>;
type MyToolResult = CoreToolResultUnion<typeof platformToolSet>;
