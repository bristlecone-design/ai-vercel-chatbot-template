import { IMAGE_WIDTH_SMALL, type ImageProps } from '.';
import ImageWithFallback from './image-with-fallback';

export default function ImageSmall(props: ImageProps) {
  const { aspectRatio, blurCompatibilityMode, ...rest } = props;
  return (
    <ImageWithFallback
      {...{
        ...rest,
        blurCompatibilityLevel: blurCompatibilityMode ? 'high' : 'none',
        width: IMAGE_WIDTH_SMALL,
        height: Math.round(IMAGE_WIDTH_SMALL / aspectRatio),
      }}
    />
  );
}
