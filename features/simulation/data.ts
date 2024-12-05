import type { FilmSimulation } from '.';
import { getPhotosCached, getPhotosMetaCached } from '../photo/cache';

export const getPhotosFilmSimulationDataCached = ({
  simulation,
  limit,
}: {
  simulation: FilmSimulation;
  limit?: number;
}) =>
  Promise.all([
    getPhotosCached({ simulation, limit }),
    getPhotosMetaCached({ simulation }),
  ]);
