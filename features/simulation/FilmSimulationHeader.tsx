import { descriptionForFilmSimulationPhotos, type FilmSimulation } from '.';
import type { PhotoDateRange } from '../photo';
import PhotoSetHeader from '../photo/PhotoSetHeader';
import PhotoFilmSimulation from './PhotoFilmSimulation';

import type { Photo } from '@/types/photo';
import { pathForFilmSimulationShare } from '@/config/site-paths';

export default function FilmSimulationHeader({
  simulation,
  photos,
  selectedPhoto,
  indexNumber,
  count,
  dateRange,
}: {
  simulation: FilmSimulation;
  photos: Photo[];
  selectedPhoto?: Photo;
  indexNumber?: number;
  count?: number;
  dateRange?: PhotoDateRange;
}) {
  return (
    <PhotoSetHeader
      entity={<PhotoFilmSimulation {...{ simulation }} />}
      entityVerb="Photo"
      entityDescription={descriptionForFilmSimulationPhotos(
        photos,
        undefined,
        count,
        dateRange
      )}
      photos={photos}
      selectedPhoto={selectedPhoto}
      sharePath={pathForFilmSimulationShare(simulation)}
      indexNumber={indexNumber}
      count={count}
      dateRange={dateRange}
    />
  );
}
