import { expirePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

import { getErrorMessage } from '@/lib/errors';

// export const runtime = 'edge';

export { handler as POST };

type PostParams = {
  chatId: string;
  msgId?: string;
};

/**
 * Handles resetting a chat's cache, both /chat/ and /share/ paths
 */
const handler = async (request: NextRequest) => {
  try {
    const { chatId, msgId } = (await request.json()) as PostParams;

    if (!chatId) {
      throw new Error('No chat ID provided to reset cache for.');
    }

    const chatPath = `/chat/${chatId}`;
    expirePath(chatPath);
    expirePath(`/share/${chatId}`);

    let chatMsgPath: string | undefined;

    if (msgId) {
      chatMsgPath = `${chatPath}/${msgId}`;
      expirePath(chatMsgPath);
    }

    return NextResponse.json({
      cacheCleared: true,
      chatMsgPath,
      chatPath,
      chatId: chatId,
      msgId: msgId,
    });
  } catch (error) {
    console.log('Error crawling: ', error);
    const errMsg = getErrorMessage(error);
    return new Response(`Failed to reset cache: ${errMsg}`, {
      status: 500,
      statusText: errMsg,
    });
  }
};
