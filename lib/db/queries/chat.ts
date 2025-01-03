import { db } from '@/lib/db/connect';
import {
    type Chat,
    type MessageSave,
    chat,
    message,
    users,
    vote,
} from '@/lib/db/schema';
import type { UserChat } from '@/types/chat-msgs';
import { and, asc, desc, eq, gte } from 'drizzle-orm';
import type { User } from 'next-auth';

import 'server-only';

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({
  id,
  includeUser,
}: { id: string; includeUser?: boolean }): Promise<Array<UserChat>> {
  try {
    if (includeUser) {
      const [selectedChat] = await db
        .select({
          Chat: chat,
          User: {
            id: users.id,
            name: users.name,
            email: users.email,
            image: users.image,
            bio: users.bio,
            url: users.url,
            company: users.company,
            public: users.public,
            waitlist: users.waitlist,
          },
        })
        .from(chat)
        .fullJoin(users, eq(chat.userId, users.id))
        .where(eq(chat.id, id));

      if (!selectedChat) {
        return [];
      }

      const userChat = {
        ...(selectedChat.Chat as Chat),
        User: selectedChat.User as User,
      } as UserChat;

      return [userChat];
    }

    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));

    return [selectedChat];
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({
  messages,
}: { messages: Array<MessageSave> }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    return await db
      .delete(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function deleteMessageById({ id }: { id: string }) {
  try {
    return await db.delete(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to delete message by id from database');
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}
