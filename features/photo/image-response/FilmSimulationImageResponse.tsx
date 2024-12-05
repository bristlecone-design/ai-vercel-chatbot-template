import { FilmSimulation } from '@/simulation';
import PhotoFilmSimulationIcon from '@/simulation/PhotoFilmSimulationIcon';
import { labelForFilmSimulation } from '@/vendors/fujifilm';

import { NextImageSize } from '@/lib/next-image';

import { Photo } from '../photo';
import ImageCaption from './components/ImageCaption';
import ImageContainer from './components/ImageContainer';
import ImagePhotoGrid from './components/ImagePhotoGrid';

export default function FilmSimulationImageResponse({
  simulation,
  photos,
  width,
  height,
  fontFamily,
}: {
  simulation: FilmSimulation;
  photos: Photo[];
  width: NextImageSize;
  height: number;
  fontFamily: string;
}) {
  return (
    <ImageContainer
      {...{
        width,
        height,
        ...(photos.length === 0 && { background: 'black' }),
      }}
    >
      <ImagePhotoGrid
        {...{
          photos,
          width,
          height,
        }}
      />
      <ImageCaption
        {...{
          width,
          height,
          fontFamily,
          icon: (
            <PhotoFilmSimulationIcon
              simulation={simulation}
              height={height * 0.081}
              style={{ transform: `translateY(${height * 0.001}px)` }}
            />
          ),
        }}
      >
        {labelForFilmSimulation(simulation).medium.toLocaleUpperCase()}
      </ImageCaption>
    </ImageContainer>
  );
}
