import { z } from 'zod';

const AllowedToolsDictionary = {
  discover: 'discover',
  createDocument: 'createDocument',
  updateDocument: 'updateDocument',
  requestDocumentSuggestions: 'requestDocumentSuggestions',
  getWeather: 'getWeather',
} as const;

export const allowedToolsSchema = z.nativeEnum(AllowedToolsDictionary);

export type AllowedTools = z.infer<typeof allowedToolsSchema>;

export const discoveryTools = ['discover'] satisfies AllowedTools[];

export const weatherTools = ['getWeather'] satisfies AllowedTools[];

export const blocksTools = [
  'createDocument',
  'updateDocument',
  'requestDocumentSuggestions',
] satisfies AllowedTools[];

export const allTools = [
  ...discoveryTools,
  ...blocksTools,
  ...weatherTools,
] satisfies AllowedTools[];

export const allToolsSansDiscover = allTools.filter(
  (tool) => tool !== 'discover',
) satisfies AllowedTools[];

export const coreBetaPlatformTools = [...discoveryTools, ...weatherTools];

export type CoreBetaPlatformTools = (typeof coreBetaPlatformTools)[number];

export const toolsWithCustomUI = [
  'discover',
  'getWeather',
  'createDocument',
  'updateDocument',
  'requestDocumentSuggestions',
] satisfies AllowedTools[];

export type ToolsWithCustomUI = (typeof toolsWithCustomUI)[number];
