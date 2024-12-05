import { cameraFromPhoto, formatCameraModelTextShort } from '@/camera';
import { AiFillApple } from 'react-icons/ai';

import { NextImageSize } from '@/lib/next-image';

import { shouldShowExifDataForPhoto } from '../photo';
import ImageCaption from './components/ImageCaption';
import ImageContainer from './components/ImageContainer';
import ImagePhotoGrid from './components/ImagePhotoGrid';

import { Photo } from '@/types/photo';
import { OG_TEXT_BOTTOM_ALIGNMENT } from '@/config/site-settings';

export default function PhotoImageResponse({
  photo,
  width,
  height,
  fontFamily,
  isNextImageReady = true,
}: {
  photo: Photo;
  width: NextImageSize;
  height: number;
  fontFamily: string;
  isNextImageReady: boolean;
}) {
  const caption = [
    photo.model
      ? formatCameraModelTextShort(cameraFromPhoto(photo))
      : undefined,
    photo.focalLengthFormatted,
    photo.fNumberFormatted,
    photo.isoFormatted,
  ]
    .join(' ')
    .trim();

  return (
    <ImageContainer {...{ width, height }}>
      <ImagePhotoGrid
        {...{
          photos: isNextImageReady ? [photo] : [],
          width,
          height,
          ...(OG_TEXT_BOTTOM_ALIGNMENT && { imagePosition: 'top' }),
        }}
      />
      {shouldShowExifDataForPhoto(photo) && (
        <ImageCaption
          {...{
            width,
            height,
            fontFamily,
            ...(photo.make === 'Apple' && {
              icon: (
                <AiFillApple
                  style={{
                    marginRight: height * 0.01,
                  }}
                />
              ),
            }),
          }}
        >
          {caption}
        </ImageCaption>
      )}
    </ImageContainer>
  );
}
