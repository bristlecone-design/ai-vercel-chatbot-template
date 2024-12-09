import type { Media } from '@/lib/db/schema';

export enum MediaResultCode {
  Success = 'SUCCESS',
  UnknownError = 'UNKNOWN_ERROR',
}

export interface MediaUpdateResult {
  type: string;
  resultCode: MediaResultCode;
  data?: Media;
}
