import {
  absolutePathForFilmSimulation,
  absolutePathForFilmSimulationImage,
} from '@/config/site-paths';
import type { Photo } from '@/types/photo';
import {
  photoQuantityText,
  type PhotoDateRange,
  descriptionForPhotoSet,
} from '../photo';
import {
  type FujifilmSimulation,
  labelForFilmSimulation,
} from '../photo/vendors/fujifilm';

export type FilmSimulation = FujifilmSimulation;

export type FilmSimulationWithCount = {
  simulation: FilmSimulation;
  count: number;
};

export type FilmSimulations = FilmSimulationWithCount[];

export const sortFilmSimulationsWithCount = (
  a: FilmSimulationWithCount,
  b: FilmSimulationWithCount,
) => {
  const aLabel = labelForFilmSimulation(a.simulation).large;
  const bLabel = labelForFilmSimulation(b.simulation).large;
  return aLabel.localeCompare(bLabel);
};

export const titleForFilmSimulation = (
  simulation: FilmSimulation,
  photos: Photo[],
  explicitCount?: number,
) =>
  [
    labelForFilmSimulation(simulation).large,
    photoQuantityText(explicitCount ?? photos.length),
  ].join(' ');

export const shareTextForFilmSimulation = (simulation: FilmSimulation) =>
  `Photos shot on Fujifilm ${labelForFilmSimulation(simulation).large}`;

export const descriptionForFilmSimulationPhotos = (
  photos: Photo[],
  dateBased?: boolean,
  explicitCount?: number,
  explicitDateRange?: PhotoDateRange,
) =>
  descriptionForPhotoSet(
    photos,
    undefined,
    dateBased,
    explicitCount,
    explicitDateRange,
  );

export const generateMetaForFilmSimulation = (
  simulation: FilmSimulation,
  photos: Photo[],
  explicitCount?: number,
  explicitDateRange?: PhotoDateRange,
) => ({
  url: absolutePathForFilmSimulation(simulation),
  title: titleForFilmSimulation(simulation, photos, explicitCount),
  description: descriptionForFilmSimulationPhotos(
    photos,
    true,
    explicitCount,
    explicitDateRange,
  ),
  images: absolutePathForFilmSimulationImage(simulation),
});
