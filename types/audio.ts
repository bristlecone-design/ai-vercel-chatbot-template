import type { AudioMedia } from '@/lib/db/schema';
import type { ExperienceModel } from './experiences';
import type { MediaModel } from './media';
import type { USER_PROFILE_MODEL } from './user';

export interface AudioMediaModel extends AudioMedia {
  Media?: MediaModel;
  User?: USER_PROFILE_MODEL;
  Experience?: ExperienceModel;
}
