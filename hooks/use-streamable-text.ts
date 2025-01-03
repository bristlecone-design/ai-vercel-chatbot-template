import { readStreamableValue } from 'ai/rsc';
import { useEffect, useState } from 'react';

import type { StreamableText } from '@/types/streamable';

// https://sdk.vercel.ai/examples/next-app/basics/streaming-text-generation
export const useStreamableText = (content: StreamableText) => {
  const [rawContent, setRawContent] = useState(
    typeof content === 'string' ? content : '',
  );

  useEffect(() => {
    (async () => {
      if (typeof content === 'object') {
        let value = '';
        for await (const delta of readStreamableValue(content)) {
          // console.log(delta);
          if (typeof delta === 'string') {
            value = value + delta;
            setRawContent(value);
          }
        }
      }
    })();
  }, [content]);

  return rawContent;
};
