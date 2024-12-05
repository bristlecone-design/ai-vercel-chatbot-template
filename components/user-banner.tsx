import Image from 'next/image';

import { getAspectRatioFromExif } from '@/lib/exif';
import { isBlobUrl, isVideo } from '@/lib/media/media-utils';
import { cn } from '@/lib/utils';

import { shimmer } from './ui/skeleton';

export type UserBannerProps = {
  url: string;
  alt?: string;
  fill?: boolean;
  priority?: boolean;
  isVideoFile?: boolean;
  fileType?: string;
  width?: number;
  height?: number;
  className?: string;
  children?: React.ReactNode;
  noShimmer?: boolean;
};

export function UserBanner({
  url,
  fill = true,
  priority = false,
  noShimmer = false,
  isVideoFile = false,
  fileType,
  alt = '',
  width,
  height,
  className = '',
  children,
}: UserBannerProps) {
  getAspectRatioFromExif;
  const isUrlAVideo = isVideoFile || isVideo(url) || isBlobUrl(url);
  // console.log(`***** isUrlAVideo in UserBanner`, {
  //   url,
  //   isUrlAVideo,
  //   isVideoFile,
  //   fileType,
  //   isVideo: isVideo(url),
  //   isBlobUrl: isBlobUrl(url),
  // });
  return (
    <div
      className={cn(
        'border-1 relative h-48 w-full overflow-clip rounded-md bg-muted md:h-56',
        className,
        !noShimmer && shimmer
      )}
    >
      {url && isUrlAVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          className="absolute size-full object-cover"
        >
          <source src={url} type={'video/mp4'} />
          <source src={url} type={'video/quicktime'} />
          Your browser does not support the video tag.
        </video>
      )}
      {url && !isUrlAVideo && (
        <Image
          fill={fill}
          alt={alt}
          src={url}
          // placeholder="blur"
          // blurDataURL={rgbDataURL(207, 189, 189)}
          priority={priority}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          className={cn('h-full object-cover', className)}
          // onLoad,
          // onError,
        />
      )}
    </div>
  );
}
