import { formatFocalLength } from '@/focal';
import { TbCone } from 'react-icons/tb';

import type { NextImageSize } from '@/lib/next-image';

import type { Photo } from '../photo';
import ImageCaption from './components/ImageCaption';
import ImageContainer from './components/ImageContainer';
import ImagePhotoGrid from './components/ImagePhotoGrid';

export default function FocalLengthImageResponse({
  focal,
  photos,
  width,
  height,
  fontFamily,
}: {
  focal: number;
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
            <TbCone
              size={height * 0.075}
              style={{
                transform: `translateY(${height * 0.007}px) rotate(270deg)`,
                marginRight: height * 0.01,
              }}
            />
          ),
        }}
      >
        {formatFocalLength(focal)}
      </ImageCaption>
    </ImageContainer>
  );
}
