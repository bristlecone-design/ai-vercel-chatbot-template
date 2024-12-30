import type { Media } from '@/lib/db/schema';
import type { Attachment } from 'ai';
import type { PhotoThumbnail } from './photo';
import type { USER_PROFILE_MODEL } from './user';

export interface MediaAttachment extends Attachment {
  // Add more attachment properties here
}
export interface MediaModel extends Media {
  User?: USER_PROFILE_MODEL;
}

export interface MediaExif
  extends Pick<
    Media,
    | 'aspectRatio'
    | 'make'
    | 'model'
    | 'focalLength'
    | 'focalLength35'
    | 'fNumber'
    | 'iso'
    | 'exposureTime'
    | 'exposureCompensation'
    | 'latitude'
    | 'longitude'
    | 'filmSimulation'
    // | 'takenAtNaive'
    // | 'takenAt'
  > {
  takenAtNaive: string;
  takenAt: string;
}

export interface MediaModelWithExif extends MediaModel {
  exif: MediaExif;
}

export interface CreateMediaModel
  extends Omit<Media, 'id' | 'createdAt' | 'updatedAt'> {}

export interface UpdateMediaModel extends Partial<Media> {
  thumbnail?: PhotoThumbnail;
}

/**
 * General media type with audio/voice props
 */
export interface MediaAudio extends Media {
  voice?: string;
}

/**
 * Text-to-Speech media with audio type
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
