import { z } from 'zod';

const AllowedToolsDictionary = {
  discover: 'discover',
  vision: 'vision', // Multimedia vision tool (e.g. image, video, audio, etc.)
  createDocument: 'createDocument',
  updateDocument: 'updateDocument',
  requestDocumentSuggestions: 'requestDocumentSuggestions',
  getWeather: 'getWeather',
} as const;

export const allowedToolsSchema = z.nativeEnum(AllowedToolsDictionary);

export type AllowedTools = z.infer<typeof allowedToolsSchema>;

export const discoveryTools = ['discover', 'vision'] satisfies AllowedTools[];

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

// Turn the above toolsWithCustomUI into a dictionary that is a subset of AllowedToolsDictionary
export const toolsWithCustomUI = {
  getWeather: 'getWeather',
  createDocument: 'createDocument',
  updateDocument: 'updateDocument',
  requestDocumentSuggestions: 'requestDocumentSuggestions',
} satisfies Partial<typeof AllowedToolsDictionary>;

export const toolsWithCustomUISchema = z.nativeEnum(toolsWithCustomUI);

export type ToolsWithCustomUI = z.infer<typeof toolsWithCustomUISchema>;
