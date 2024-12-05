'use client';

import { useEffect, useState } from 'react';
import { readStreamableValue } from 'ai/rsc';

import { StreamableBoolean } from '@/types/streamable';

// https://sdk.vercel.ai/examples/next-app/basics/streaming-text-generation
export const useStreamableBoolean = (content: StreamableBoolean) => {
  const [rawContent, setRawContent] = useState(
    typeof content === 'boolean' ? content : false
  );

  useEffect(() => {
    (async () => {
      if (typeof content === 'object') {
        for await (const delta of readStreamableValue(content)) {
          if (typeof delta === 'boolean') {
            setRawContent(delta);
          }
        }
      }
    })();
  }, [content]);

  return rawContent;
};
