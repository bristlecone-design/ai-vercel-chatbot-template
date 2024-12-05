import { NextImageSize } from '@/lib/next-image';

import { Photo } from '../photo';
import ImageCaption from './components/ImageCaption';
import ImageContainer from './components/ImageContainer';
import ImagePhotoGrid from './components/ImagePhotoGrid';

import { SITE_DOMAIN_OR_TITLE } from '@/config/site-settings';

export default function HomeImageResponse({
  photos,
  width,
  height,
  fontFamily,
}: {
  photos: Photo[];
  width: NextImageSize;
  height: number;
  fontFamily: string;
}) {
  return (
    <ImageContainer {...{ width, height }}>
      <ImagePhotoGrid
        {...{
          photos,
          width,
          height,
        }}
      />
      <ImageCaption {...{ width, height, fontFamily }}>
        {SITE_DOMAIN_OR_TITLE}
      </ImageCaption>
    </ImageContainer>
  );
}
