import { auth } from '@/app/(auth)/auth';
import { getVotesByChatId, voteMessage } from '@/lib/db/queries';
import { StatusCodes } from 'http-status-codes';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response('chatId is required', {
      status: StatusCodes.BAD_REQUEST,
    });
  }

  const session = await auth();

  if (!session || !session.user || !session.user.email) {
    return new Response('Unauthorized', { status: StatusCodes.UNAUTHORIZED });
  }

  const votes = await getVotesByChatId({ id: chatId });

  return Response.json(votes, { status: StatusCodes.OK });
}

export async function PATCH(request: Request) {
  const {
    chatId,
    messageId,
    type,
  }: { chatId: string; messageId: string; type: 'up' | 'down' } =
    await request.json();

  if (!chatId || !messageId || !type) {
    return new Response('messageId and type are required', {
      status: StatusCodes.BAD_REQUEST,
    });
  }

  const session = await auth();

  if (!session || !session.user || !session.user.email) {
    return new Response('Unauthorized', { status: StatusCodes.UNAUTHORIZED });
  }

  await voteMessage({
    chatId,
    messageId,
    type: type,
  });

  return new Response('Message voted', { status: StatusCodes.OK });
}
