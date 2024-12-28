import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import { Chat as PreviewChat } from '@/components/chat';

import { auth } from '@/app/(auth)/auth';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const [chat] = await getChatById({ id, includeUser: true });

  if (!chat) {
    notFound();
  }

  const session = await auth();

  const user = session?.user;

  let disabledActions = false;

  // Check if the user is the owner of the chat or the chat is public
  if (user) {
    // Logged in but not the owner of the chat
    const isOwner = chat.userId === user.id;
    if (!isOwner && !chat.public) {
      return notFound();
    }

    if (!isOwner) {
      disabledActions = true;
    }
  } else if (!user) {
    if (!chat.public) {
      return notFound();
    }

    // Disable actions for public chats
    disabledActions = true;
  }

  //

  // if (!session || !session.user) {
  //   return notFound();
  // }

  // if (session.user.id !== chat.userId) {
  //   return notFound();
  // }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <PreviewChat
      id={chat.id}
      disabled={disabledActions}
      initialMessages={convertToUIMessages(messagesFromDb)}
      selectedModelId={selectedModelId}
      msgsContainerClassName=""
    />
  );
}
