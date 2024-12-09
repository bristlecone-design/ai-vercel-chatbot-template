import { MediaResultCode } from './media-update-types';

export const getMediaMessageFromCode = (resultCode: string) => {
  switch (resultCode) {
    case MediaResultCode.Success:
      return 'Media successfully updated!';
    case MediaResultCode.UnknownError:
      return 'An unknown error occurred!';
  }
};
