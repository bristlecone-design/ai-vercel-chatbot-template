import type { Chat, User } from '@/lib/db/schema';
import type { Attachment, Message } from 'ai';
import type { MediaAttachment } from './media';
export interface UserChat extends Chat {
  User?: User;
}

export interface ChatMessage extends Message {
  experimental_attachments?: MediaAttachment[];
}

export type MessageAttachment = Attachment;

export type MessageParts = ChatMessage['parts'];

export type MessageAnnotations = ChatMessage['annotations'];

export type MessageDataType = 'id' | 'message-id' | 'action' | 'notification';

export type MessageDataSubType = 'error' | 'success' | 'warning' | 'user';

export type MessageData = {
  type: MessageDataType;
  subType?: MessageDataSubType;
  content: string;
};
