import { ExperienceResultCode } from './experience-action-types';

export const getExperienceMessageFromCode = (resultCode: string) => {
  switch (resultCode) {
    case ExperienceResultCode.Success:
      return 'Experience created and ready!';
    case ExperienceResultCode.UnknownError:
      return 'An unknown error occurred!';
  }
};
