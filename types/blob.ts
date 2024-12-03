import type { PutBlobResult } from '@vercel/blob';

export type PutBlobResultError = { error: boolean; message: string };
export type CustomPutBlobResult = PutBlobResult & Partial<PutBlobResultError>;
