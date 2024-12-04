import { Suspense } from 'react';
import { cookies } from 'next/headers';

import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { genChatId } from '@/lib/id';
import { Chat } from '@/components/chat';

async function DynamicChatView() {
  const id = genChatId();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <Chat
      key={id}
      id={id}
      initialMessages={[]}
      selectedModelId={selectedModelId}
    />
  );
}

export default async function Page() {
  return (
    <Suspense fallback={'...'}>
      <DynamicChatView />
    </Suspense>
  );
}
