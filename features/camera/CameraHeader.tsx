import PhotoSetHeader from '@/features/photo/PhotoSetHeader';

import { cameraFromPhoto, type Camera } from '.';
import type { PhotoDateRange } from '../photo';
import { descriptionForCameraPhotos } from './meta';
import PhotoCamera from './PhotoCamera';

import type { Photo } from '@/types/photo';
import { pathForCameraShare } from '@/config/site-paths';

export default function CameraHeader({
  camera: cameraProp,
  photos,
  selectedPhoto,
  indexNumber,
  count,
  dateRange,
}: {
  camera: Camera;
  photos: Photo[];
  selectedPhoto?: Photo;
  indexNumber?: number;
  count?: number;
  dateRange?: PhotoDateRange;
}) {
  const camera = cameraFromPhoto(photos[0], cameraProp);
  return (
    <PhotoSetHeader
      entity={<PhotoCamera {...{ camera }} contrast="high" hideAppleIcon />}
      entityVerb="Photo"
      entityDescription={descriptionForCameraPhotos(
        photos,
        undefined,
        count,
        dateRange
      )}
      photos={photos}
      selectedPhoto={selectedPhoto}
      sharePath={pathForCameraShare(camera)}
      indexNumber={indexNumber}
      count={count}
      dateRange={dateRange}
    />
  );
}
