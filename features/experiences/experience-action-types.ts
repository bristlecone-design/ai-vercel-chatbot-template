import { ExperienceModel } from '@/types/experiences';

export enum ExperienceResultCode {
  Success = 'SUCCESS',
  UnknownError = 'UNKNOWN_ERROR',
}

export interface ExperienceActionResult {
  type: 'success' | 'error';
  resultCode: ExperienceResultCode;
  msg?: string;
  data?: ExperienceModel;
}
