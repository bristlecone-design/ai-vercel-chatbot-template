import type { ImageProps as NextImageProps } from 'next/image';

import { determineHeight } from '@/lib/images';

import { IMAGE_WIDTH_MEDIUM, type ImageProps } from '.';
import ImageWithFallback from './image-with-fallback';

export default function ImageMedium(props: ImageProps & NextImageProps) {
  const {
    aspectRatio,
    blurCompatibilityMode,
    onLoad: onLoadProp,
    width,
    fill,
    ...rest
  } = props;
  const imgWidth = width || IMAGE_WIDTH_MEDIUM;
  return (
    <ImageWithFallback
      {...{
        ...rest,
        fill,
        blurCompatibilityLevel: blurCompatibilityMode ? 'high' : 'none',
        width: imgWidth,
        height: determineHeight(imgWidth as number, aspectRatio),
        onLoad: onLoadProp ?? undefined,
      }}
    />
  );
}
