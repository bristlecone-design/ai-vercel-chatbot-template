import SharePhotoModal from '@/components/share-photo';

import { shareTextForFilmSimulation, type FilmSimulation } from '.';
import type { PhotoDateRange } from '../photo';
import FilmSimulationOGTile from './FilmSimulationOGTile';

import type { Photo } from '@/types/photo';
import {
  absolutePathForFilmSimulation,
  pathForFilmSimulation,
} from '@/config/site-paths';

export default function FilmSimulationShareModal({
  simulation,
  photos,
  count,
  dateRange,
}: {
  simulation: FilmSimulation;
  photos: Photo[];
  count?: number;
  dateRange?: PhotoDateRange;
}) {
  return (
    <SharePhotoModal
      pathShare={absolutePathForFilmSimulation(simulation)}
      pathClose={pathForFilmSimulation(simulation)}
      socialText={shareTextForFilmSimulation(simulation)}
    >
      <FilmSimulationOGTile {...{ simulation, photos, count, dateRange }} />
    </SharePhotoModal>
  );
}
