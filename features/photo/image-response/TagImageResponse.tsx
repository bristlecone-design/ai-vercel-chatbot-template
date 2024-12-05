import { formatTag, isTagFavs } from '@/tag';
import { FaStar, FaTag } from 'react-icons/fa';

import type { NextImageSize } from '@/lib/next-image';

import type { Photo } from '../photo';
import ImageCaption from './components/ImageCaption';
import ImageContainer from './components/ImageContainer';
import ImagePhotoGrid from './components/ImagePhotoGrid';

export default function TagImageResponse({
  tag,
  photos,
  width,
  height,
  fontFamily,
}: {
  tag: string;
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
          icon: isTagFavs(tag) ? (
            <FaStar
              size={height * 0.066}
              style={{
                transform: `translateY(${height * 0.0095}px)`,
                // Fix horizontal distortion in icon size
                width: height * 0.076,
                marginRight: height * 0.015,
              }}
            />
          ) : (
            <FaTag
              size={height * 0.06}
              style={{
                transform: `translateY(${height * 0.016}px)`,
                marginRight: height * 0.02,
              }}
            />
          ),
        }}
      >
        {formatTag(tag).toLocaleUpperCase()}
      </ImageCaption>
    </ImageContainer>
  );
}
