import { IMAGE_WIDTH_LARGE, type ImageProps } from '.';
import ImageWithFallback from './image-with-fallback';

export default function ImageLarge(props: ImageProps) {
  const { aspectRatio, blurCompatibilityMode, ...rest } = props;
  return (
    <ImageWithFallback
      {...{
        ...rest,
        blurCompatibilityLevel: blurCompatibilityMode ? 'high' : 'none',
        width: IMAGE_WIDTH_LARGE,
        height: Math.round(IMAGE_WIDTH_LARGE / aspectRatio),
      }}
    />
  );
}
