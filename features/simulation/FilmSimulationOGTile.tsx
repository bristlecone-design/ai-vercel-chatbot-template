import OGTile from '@/components/og-tile';

import {
  descriptionForFilmSimulationPhotos,
  titleForFilmSimulation,
  type FilmSimulation,
} from '.';
import type { PhotoDateRange } from '../photo';

import type { Photo } from '@/types/photo';
import {
  absolutePathForFilmSimulationImage,
  pathForFilmSimulation,
} from '@/config/site-paths';

export type OGLoadingState = 'unloaded' | 'loading' | 'loaded' | 'failed';

export default function FilmSimulationOGTile({
  simulation,
  photos,
  loadingState: loadingStateExternal,
  riseOnHover,
  onLoad,
  onFail,
  retryTime,
  count,
  dateRange,
}: {
  simulation: FilmSimulation;
  photos: Photo[];
  loadingState?: OGLoadingState;
  onLoad?: () => void;
  onFail?: () => void;
  riseOnHover?: boolean;
  retryTime?: number;
  count?: number;
  dateRange?: PhotoDateRange;
}) {
  return (
    <OGTile
      {...{
        title: titleForFilmSimulation(simulation, photos, count),
        description: descriptionForFilmSimulationPhotos(
          photos,
          true,
          count,
          dateRange
        ),
        path: pathForFilmSimulation(simulation),
        pathImageAbsolute: absolutePathForFilmSimulationImage(simulation),
        loadingState: loadingStateExternal,
        onLoad,
        onFail,
        riseOnHover,
        retryTime,
      }}
    />
  );
}
