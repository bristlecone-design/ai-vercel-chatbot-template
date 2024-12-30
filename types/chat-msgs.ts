import type { Chat, User } from '@/lib/db/schema';
import type { Message } from 'ai';
import type { MediaAttachment } from './media';
export interface UserChat extends Chat {
  User?: User;
}

export interface ChatMessage extends Message {
  experimental_attachments?: MediaAttachment[];
}
