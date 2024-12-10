import type { USER_PROFILE_MODEL } from '@/types/user';

export enum UserProfileResultCode {
  Success = 'SUCCESS',
  UnknownError = 'UNKNOWN_ERROR',
}

export interface UserProfileUpdateResult {
  type: string;
  resultCode: UserProfileResultCode;
  data?: USER_PROFILE_MODEL | null;
}
