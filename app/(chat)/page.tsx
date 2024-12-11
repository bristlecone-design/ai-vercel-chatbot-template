import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { getCachedUserWaitlistCount } from '@/actions/user';

import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { genChatId } from '@/lib/id';
import { getUserSession } from '@/lib/session';
import { DiscoveryBgImageContainer } from '@/components/bg-image-random-client';
import { Chat } from '@/components/chat';
import { ExperienceSplashScreen } from '@/components/discovery/discovery-splash-screen';

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

async function DynamicUnauthenticatedSplashView() {
  const waitlistCount = await getCachedUserWaitlistCount();
  return (
    <DiscoveryBgImageContainer>
      <ExperienceSplashScreen waitlistCount={waitlistCount} />
    </DiscoveryBgImageContainer>
  );
}

export default async function Page() {
  const session = await getUserSession();

  return (
    <Suspense fallback={''}>
      {session && <DynamicChatView />}
      {!session && <DynamicUnauthenticatedSplashView />}
    </Suspense>
  );
}
