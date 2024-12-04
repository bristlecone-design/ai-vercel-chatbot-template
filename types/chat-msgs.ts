import type { Chat, User } from '@/lib/db/schema';

export interface UserChat extends Chat {
  User?: User;
}
