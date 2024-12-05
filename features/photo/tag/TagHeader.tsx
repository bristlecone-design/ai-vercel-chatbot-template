import { Photo, PhotoDateRange } from '@/photo';
import PhotoSetHeader from '@/photo/PhotoSetHeader';

import { descriptionForTaggedPhotos, isTagFavs } from '.';
import FavsTag from './FavsTag';
import PhotoTag from './PhotoTag';

import { pathForTagShare } from '@/config/site-paths';

export default function TagHeader({
  tag,
  photos,
  selectedPhoto,
  indexNumber,
  count,
  dateRange,
}: {
  tag: string;
  photos: Photo[];
  selectedPhoto?: Photo;
  indexNumber?: number;
  count?: number;
  dateRange?: PhotoDateRange;
}) {
  return (
    <PhotoSetHeader
      entity={
        isTagFavs(tag) ? (
          <FavsTag contrast="high" />
        ) : (
          <PhotoTag tag={tag} contrast="high" />
        )
      }
      entityVerb="Tagged"
      entityDescription={descriptionForTaggedPhotos(photos, undefined, count)}
      photos={photos}
      selectedPhoto={selectedPhoto}
      sharePath={pathForTagShare(tag)}
      indexNumber={indexNumber}
      count={count}
      dateRange={dateRange}
    />
  );
}
