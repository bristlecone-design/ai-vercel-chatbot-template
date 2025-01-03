import { Suspense } from 'react';
import { cookies } from 'next/headers';
import type { Session } from 'next-auth';

import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { getCachedUserWaitlistCount } from '@/lib/db/queries/user';
import { genChatId } from '@/lib/id';
import { getUserSession } from '@/lib/session';
import { Chat } from '@/components/chat';
import { ExperienceSplashScreen } from '@/components/discovery/discovery-splash-screen';

async function DynamicAuthenicatedChatView({
  user,
}: {
  user: Session['user'];
}) {
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
      notAllowedToDiscover={user.privateBeta !== true}
    />
  );
}

async function DynamicUnauthenticatedSplashView() {
  const waitlistCount = await getCachedUserWaitlistCount();
  return <ExperienceSplashScreen waitlistCount={waitlistCount} />;
}

export default async function Page() {
  const session = await getUserSession();

  return (
    <Suspense fallback={''}>
      {session && <DynamicAuthenicatedChatView user={session.user} />}
      {!session && <DynamicUnauthenticatedSplashView />}
    </Suspense>
  );
}
