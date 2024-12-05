import type { FilmSimulation } from '.';
import type { PhotoDateRange } from '../photo';
import PhotoGridPage from '../photo/PhotoGridPage';
import FilmSimulationHeader from './FilmSimulationHeader';

import type { Photo } from '@/types/photo';

export default function FilmSimulationOverview({
  simulation,
  photos,
  count,
  dateRange,
  animateOnFirstLoadOnly,
}: {
  simulation: FilmSimulation;
  photos: Photo[];
  count: number;
  dateRange?: PhotoDateRange;
  animateOnFirstLoadOnly?: boolean;
}) {
  return (
    <PhotoGridPage
      {...{
        cacheKey: `simulation-${simulation}`,
        photos,
        count,
        simulation,
        header: (
          <FilmSimulationHeader
            {...{
              simulation,
              photos,
              count,
              dateRange,
            }}
          />
        ),
        animateOnFirstLoadOnly,
      }}
    />
  );
}
