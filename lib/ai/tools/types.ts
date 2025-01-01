export type AllowedTools =
  | 'discover'
  | 'createDocument'
  | 'updateDocument'
  | 'requestDocumentSuggestions'
  | 'getWeather';

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
