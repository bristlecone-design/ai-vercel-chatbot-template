'use client';

import React from 'react';
import Image from 'next/image';
import { useDebouncedCallback } from 'use-debounce';
import { useIntersectionObserver } from 'usehooks-ts';

import {
  isHorizontalWideScreen,
  isPortrait,
  isVerticalWideScreen,
} from '@/lib/images';
import {
  createObjectURLFromSrcPath,
  isImage,
  isImageExtension,
  isVideo,
  isVideoExtension,
  sortRawMediaForGallery,
} from '@/lib/media/media-utils';
import { getNextImageUrlForManipulation } from '@/lib/next-image';
import { cn, sleep } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Badge } from '@/components/ui/badge';
import { IconImageGallery, IconMapPin } from '@/components/ui/icons';
import { BlockSkeleton } from '@/components/ui/skeleton';

import type { ExperienceMediaModel } from '@/types/experiences';

export type ExperienceSingleMediaProps = {
  item: ExperienceMediaModel;
  className?: string;
  mediaGalleryOpened?: boolean;
  isSingleMedia?: boolean;
  mediaClassName?: string;
  videoAutoPlay?: boolean;
  showMapIcon?: boolean;
  useBlobUrl?: boolean;
  intersectingThreshold?: number;
  onClickSingleMediaGallery?: (index?: number) => void;
};

export function ExperienceSingleMedia({
  item,
  className,
  mediaClassName,
  videoAutoPlay,
  showMapIcon,
  useBlobUrl = false,
  isSingleMedia = false,
  mediaGalleryOpened = false,
  intersectingThreshold = 0.1,
  onClickSingleMediaGallery,
}: ExperienceSingleMediaProps) {
  const imgRef = React.useRef<HTMLImageElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const { isIntersecting, ref: intersectionRef } = useIntersectionObserver({
    threshold: intersectingThreshold,
  });

  const {
    id,
    blurData,
    caption,
    extension,
    latitude,
    longitude,
    aspectRatio: aspectRatioProp,
    urlOriginal,
    experienceId,
    url,
    alt,
    title,
  } = item;

  const srcUrl = urlOriginal || url;

  const [srcObjectUrl, setSrcObjectUrl] = React.useState<string>('');

  const [isMediaLoaded, setIsMediaLoaded] = React.useState(false);
  const [isMediaPaused, setIsMediaPaused] = React.useState(mediaGalleryOpened);

  const [mediaIsWide, setMediaIsWide] = React.useState(false);
  const [mediaIsPortrait, setMediaIsPortrait] = React.useState(false);
  const [mediaIsLandscape, setMediaIsLandscape] = React.useState(false);
  const [mediaAspectRatio, setMediaAspectRatio] = React.useState<
    number | undefined | null
  >(aspectRatioProp);

  // Video specific states
  const [canPlayVideo, setCanPlayVideo] = React.useState(false);
  const [videoCurrenTime, setVideoCurrentTime] = useLocalStorage<number>(
    `video-current-time-${id}`,
    0
  );
  // console.log('**** Video current time', videoCurrenTime);

  const mediaIsImage = extension
    ? isImageExtension(extension)
    : isImage(srcUrl);

  const mediaIsVideo = extension
    ? isVideoExtension(extension)
    : isVideo(srcUrl);

  // const videoAspectRatioClass = mediaAspectRatio
  //   ? `aspect-[${mediaAspectRatio}]`
  //   : 'aspect-video';

  // Debounced function for video current time
  const debounced = useDebouncedCallback(
    async (value) => {
      // console.log('**** Video current time debounced', value);
      setVideoCurrentTime(value);
    },
    250,
    {
      leading: true,
      trailing: false,
    }
  );

  // Toggle video play/pause
  const toggleVideoPlayPause = React.useCallback(
    (play: undefined | boolean = undefined) => {
      if (videoRef.current) {
        if (play === true || videoRef.current.paused) {
          videoRef.current.play();
          setIsMediaPaused(false);
        } else {
          videoRef.current.pause();
          setIsMediaPaused(true);
        }
      }
    },
    []
  );

  // Determine the aspect ratio and orientation of the media
  const determineVideoAspectRatioAndOrientation = (
    el: HTMLVideoElement | HTMLImageElement
  ) => {
    let element: HTMLVideoElement | HTMLImageElement | undefined;
    let width: number | undefined;
    let height: number | undefined;

    if (el instanceof HTMLVideoElement) {
      element = el as HTMLVideoElement;
      width = element.videoWidth;
      height = element.videoHeight;
    } else if (el instanceof HTMLImageElement) {
      element = el as HTMLImageElement;
      width = element.naturalWidth;
      height = element.naturalHeight;
    }

    let aspectRatio: number | undefined;
    if (element && width && height) {
      aspectRatio = width / height;
      if (aspectRatio) {
        setMediaAspectRatio(aspectRatio);
      }

      // Orientation
      if (isPortrait(width, height)) {
        setMediaIsPortrait(true);
        setMediaIsWide(isVerticalWideScreen(width, height));
        setMediaIsLandscape(false);
      } else {
        setMediaIsPortrait(false);
        setMediaIsWide(isHorizontalWideScreen(width, height));
        setMediaIsLandscape(true);
      }
    }
  };

  React.useEffect(() => {
    const loadMediaObjectUrl = async () => {
      if (srcUrl && !srcObjectUrl && useBlobUrl) {
        const optimizedSource =
          mediaIsImage && urlOriginal
            ? getNextImageUrlForManipulation(urlOriginal, 1200)
            : srcUrl;

        const sou = await createObjectURLFromSrcPath(optimizedSource);
        if (sou) {
          setSrcObjectUrl(sou);
        }
      }
    };

    if (useBlobUrl && isIntersecting) {
      loadMediaObjectUrl();
    }
  }, [
    srcUrl,
    useBlobUrl,
    mediaIsImage,
    srcObjectUrl,
    urlOriginal,
    isIntersecting,
  ]);

  // Toggle video play/pause on media gallery open/close
  // React.useEffect(() => {
  //   if (mediaIsVideo) {
  //     // If not paused and media gallery is opened, pause the video
  //     if (!isMediaPaused && mediaGalleryOpened) {
  //       toggleVideoPlayPause(false);
  //     }
  //     // If paused and media gallery is closed and videoAutoPlay is true, play the video
  //     if (isMediaPaused && !mediaGalleryOpened && videoAutoPlay) {
  //       toggleVideoPlayPause(true);
  //     }
  //   }
  // }, [
  //   mediaIsVideo,
  //   isMediaPaused,
  //   videoAutoPlay,
  //   mediaGalleryOpened,
  //   toggleVideoPlayPause,
  // ]);

  // console.log('Media props', {
  //   url,
  //   mediaIsImage,
  //   mediaIsVideo,
  //   mediaAspectRatio,
  //   mediaIsPortrait,
  //   mediaIsLandscape,
  //   mediaIsWide,
  // });

  const hasMediaGalleryHandler =
    typeof onClickSingleMediaGallery === 'function';

  const hasGeoLocation = Boolean(latitude && longitude);

  const mediaDimensionsUndetermined =
    !isMediaLoaded &&
    !mediaIsWide &&
    !mediaIsPortrait &&
    !mediaIsLandscape &&
    !mediaAspectRatio;

  const showSingleVideoDefaultDimensions =
    isSingleMedia && mediaIsVideo && mediaDimensionsUndetermined;

  // console.log('**** mediaIs ....', {
  //   isSingleMedia,
  //   mediaAspectRatio,
  //   showSingleVideoDefaultDimensions,
  //   mediaDimensionsUndetermined,
  //   mediaIsWide,
  //   mediaIsPortrait,
  //   mediaIsLandscape,
  //   mediaIsImage,
  //   mediaIsVideo,
  // });

  const showSkeleton =
    (!isMediaLoaded && mediaIsImage) ||
    (!isMediaLoaded && !blurData) ||
    (mediaIsVideo && !srcObjectUrl && !canPlayVideo);

  if (!srcUrl) {
    // console.log('No media URL provided for media item', item);
    return null;
  }

  const srcUrlToUse = useBlobUrl ? srcObjectUrl : srcUrl;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    // biome-ignore lint/nursery/noStaticElementInteractions: <explanation>
    <div
      ref={intersectionRef}
      className={cn(
        'relative overflow-clip rounded-lg',
        'transition-all duration-300',
        'shrink-0 self-stretch',
        {
          // 'opacity-0': !isMediaLoaded && !blurData,
          // 'opacity-100': isMediaLoaded,
          // Defaults
          'aspect-image': mediaIsImage,
          'aspect-video': mediaIsVideo && !showSingleVideoDefaultDimensions,
          // Overrides
          'aspect-image-portrait':
            mediaIsImage && mediaIsPortrait && !mediaIsWide,
          'aspect-image-landscape':
            mediaIsImage && mediaIsLandscape && !mediaIsWide,
          'aspect-image-landscape-wide':
            (mediaIsImage && mediaIsLandscape && mediaIsWide) ||
            showSingleVideoDefaultDimensions,
          'aspect-video-portrait-wide':
            mediaIsVideo &&
            mediaIsPortrait &&
            mediaIsWide &&
            !showSingleVideoDefaultDimensions,
          'aspect-video-landscape-wide':
            mediaIsVideo &&
            mediaIsLandscape &&
            mediaIsWide &&
            !showSingleVideoDefaultDimensions,
        },
        {
          'w-full': isSingleMedia && mediaIsVideo,
        },
        {
          'cursor-pointer': hasMediaGalleryHandler,
          'brightness-90 hover:brightness-100': hasMediaGalleryHandler,
        },
        {
          // 'border-2 border-border': true,
        },
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof onClickSingleMediaGallery === 'function') {
          onClickSingleMediaGallery();
        }
      }}
    >
      {showSkeleton && (
        <BlockSkeleton className="absolute inset-0 z-[1000] size-full rounded-lg" />
      )}
      {mediaIsImage && srcUrlToUse && (isIntersecting || isMediaLoaded) && (
        <Image
          fill
          loading="lazy"
          key={`single-media-${id}-${mediaAspectRatio ? mediaAspectRatio : 'unknown'}`}
          // width={mediaIsLandscape ? imageLandscapeWidth : imagePortraitWidth}
          placeholder={blurData ? 'blur' : undefined}
          blurDataURL={blurData ? blurData : undefined}
          src={srcUrlToUse}
          // width={320}
          // height={240}
          alt={caption || 'User Media Asset'}
          className={cn(
            'pointer-events-none my-0 h-full min-h-full object-cover',
            mediaClassName
          )}
          onLoad={async (img) => {
            // Determine the aspect ratio of the image (if not provided)
            const imgTarget = img.currentTarget;
            determineVideoAspectRatioAndOrientation(imgTarget);
            await sleep(125);
            setIsMediaLoaded(true);
          }}
        />
      )}
      {mediaIsVideo && srcUrlToUse && (isIntersecting || isMediaLoaded) && (
        <video
          ref={videoRef}
          // initial={{ opacity: 0, scale: 0.1 }}
          // animate={{ opacity: 1, scale: 1 }}
          // transition={{ duration: 1 }}
          // exit={{ opacity: 0, scale: 0.1 }}
          loop
          muted
          controls
          playsInline
          autoPlay={videoAutoPlay}
          controlsList="nodownload"
          // width={mediaIsPortrait ? videoPortraitWidth : videoLandscapeWidth}
          // height={mediaIsPortrait ? videoPortraitHeight : videoLandscapeHeight}
          onCanPlay={async (e) => {
            // console.log('**** Video can play', e);
            const videoEl = e.currentTarget;
            setIsMediaLoaded(true);
            determineVideoAspectRatioAndOrientation(videoEl);
            setCanPlayVideo(true);
          }}
          // onLoadedData={(e) => {
          //   // console.log('**** Video data loaded', e);
          //   const videoEl = e.currentTarget;
          //   // If the video has a saved time, set it
          //   // if (videoEl) {
          //   //   videoEl.currentTime = videoCurrenTime;
          //   // }
          // }}
          onLoadedMetadata={(e) => {
            // console.log('***** onLoadedMetadata invoked', e);
            // If the video has a saved time, set it
            if (videoCurrenTime) {
              e.currentTarget.currentTime = videoCurrenTime;
            }
          }}
          onTimeUpdate={(e) => {
            const currentTime = e.currentTarget.currentTime;
            if (currentTime) {
              // console.log('**** Video current time updated', currentTime);
              debounced(currentTime);
            }
          }}
          className={cn(
            'my-0 h-full min-h-full object-cover',
            {
              'min-w-full': !isMediaLoaded,
            },
            mediaClassName
          )}
        >
          <source src={srcUrlToUse} type="video/mp4" />
          <source src={srcUrlToUse} type="video/webm" />
          <source src={srcUrlToUse} type="video/ogg" />
        </video>
      )}

      {showMapIcon && hasGeoLocation && (
        <IconMapPin className="absolute bottom-2.5 right-2.5 brightness-85" />
      )}
    </div>
  );
}

export type ExperienceMediaProps = {
  media: ExperienceMediaModel[];
  children?: React.ReactNode;
  mediaContainerClassName?: string;
  className?: string;
  mediaSingleClassName?: string;
  showIndividualMapIcon?: boolean;
  videoAutoPlay?: boolean;
  excludeAudio?: boolean;
  mediaGalleryOpened?: boolean;
  onClickSingleMedia?: (media: ExperienceMediaModel) => void;
  onClickSingleMediaGallery?: (index: number) => void;
};

export function ExperienceMedia({
  media,
  children,
  className,
  excludeAudio = true,
  videoAutoPlay = false,
  mediaGalleryOpened = false,
  mediaSingleClassName,
  mediaContainerClassName,
  showIndividualMapIcon,
  onClickSingleMediaGallery,
}: ExperienceMediaProps) {
  if (!media || !media.length) {
    return null;
  }

  const sortedMedia = sortRawMediaForGallery<ExperienceMediaModel[]>(
    media,
    true
  );

  const mediaCount = sortedMedia.length;
  const isSingleMediaAsset = mediaCount === 1;
  const multipleMediaAssets = mediaCount > 1;

  const singleMediaAsset = isSingleMediaAsset ? sortedMedia[0] : null;
  const singleMediaAssetIsVideo = singleMediaAsset?.urlOriginal
    ? isVideo(singleMediaAsset.urlOriginal) ||
      isVideoExtension(singleMediaAsset.urlOriginal)
    : false;

  return (
    <div
      className={cn(
        'group/exp-media relative w-full flex-nowrap items-center justify-start gap-2 overflow-auto rounded-lg p-0',
        {
          flex: !isSingleMediaAsset,
          'h-72 sm:h-80': !isSingleMediaAsset,
          grid: isSingleMediaAsset,
          'max-h-108 min-h-80 sm:max-h-140 sm:min-h-96':
            isSingleMediaAsset && !singleMediaAssetIsVideo,
          'max-h-108': isSingleMediaAsset && singleMediaAssetIsVideo,
        },
        className
      )}
    >
      {/* https://play.tailwindcss.com/o7Ie778XM5 */}
      {children}
      {sortedMedia.map((mediaItem: ExperienceMediaModel, index) => {
        if (!mediaItem) {
          return null;
        }

        return (
          <ExperienceSingleMedia
            key={mediaItem.id}
            item={mediaItem}
            videoAutoPlay={videoAutoPlay}
            isSingleMedia={isSingleMediaAsset}
            showMapIcon={showIndividualMapIcon}
            mediaClassName={mediaSingleClassName}
            mediaGalleryOpened={mediaGalleryOpened}
            className={cn({
              'max-h-[inherit]': singleMediaAssetIsVideo,
            })}
            // Disable threshold for single video assets
            intersectingThreshold={singleMediaAssetIsVideo ? 0 : undefined}
            onClickSingleMediaGallery={
              typeof onClickSingleMediaGallery === 'function'
                ? () => onClickSingleMediaGallery(index)
                : undefined
            }
          />
        );
      })}
      {multipleMediaAssets && (
        <div className="absolute bottom-1.5 left-1.5">
          <Badge
            variant="default"
            className="flex cursor-pointer gap-1.5 rounded-full bg-foreground/40 leading-none transition-colors duration-150 hover:bg-foreground/75"
            onClick={(e) => {
              if (typeof onClickSingleMediaGallery === 'function') {
                e.preventDefault();
                e.stopPropagation();
                onClickSingleMediaGallery(0);
              }
            }}
          >
            <IconImageGallery className="size-4" />
            {mediaCount}
          </Badge>
        </div>
      )}
    </div>
  );
}
