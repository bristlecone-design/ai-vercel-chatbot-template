import type { Media } from '@/lib/db/schema';
import type { PhotoThumbnail } from './photo';

export interface MediaModel extends Media {}

export interface CreateMediaModel
  extends Omit<Media, 'id' | 'createdAt' | 'updatedAt'> {}

export interface UpdateMediaModel extends Partial<Media> {
  thumbnail?: PhotoThumbnail;
}

/**
 * General media type for audio
 */
export interface MediaAudio extends Media {
  voice?: string;
}

/**
 * Text-to-Speech media audio type
 */
export interface MediaAudioTextToSpeech
  extends Pick<
    MediaAudio,
    | 'id'
    // | 'createdAt'
    | 'updatedAt'
    | 'order'
    | 'url'
    | 'urlOriginal'
    | 'language'
    | 'model'
    | 'voice'
    | 'isTTS'
    | 'latitude'
    | 'longitude'
    | 'experienceId'
    // | 'userId'
  > {
  createdAt?: MediaAudio['createdAt'];
  userId?: MediaAudio['userId'];
}

export type MediaAudioTextToSpeechKeys = keyof MediaAudioTextToSpeech;
