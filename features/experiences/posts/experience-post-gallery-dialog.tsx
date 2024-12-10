'use client';

import * as React from 'react';
import Image from 'next/image';
import type { DialogProps } from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { wrap } from 'popmotion';
import { useKey } from 'react-use';
import { useDebouncedCallback } from 'use-debounce';

import { timeAgo } from '@/lib/datesAndTimes';
import { isPortrait, isWideScreen } from '@/lib/images';
import {
  isImage,
  isImageExtension,
  isVideo,
  isVideoExtension,
} from '@/lib/media/media-utils';
import { cn, sleep } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerNested,
  DrawerTitle,
  type DrawerContentProps,
} from '@/components/ui/drawer';
import { IconArrowLeft, IconMapPinned } from '@/components/ui/icons';
import { BlockSkeleton } from '@/components/ui/skeleton';
import { ExperienceMapClient } from '@/components/maps/maps';
import { UserAvatar } from '@/components/user-avatar';

import type {
  ExperienceMediaModel,
  ExperienceModel,
} from '@/types/experiences';
import type { USER_PROFILE_MODEL } from '@/types/user';

/**
 * Image Gallery for Experience Post
 *
 * Inspiration: https://codesandbox.io/p/sandbox/framer-motion-image-gallery-pqvx3?file=%2Fsrc%2FExample.tsx&from-embed=
 */

const variants = {
  enter: (direction: number) => {
    return {
      // x: direction > 0 ? 10 : -10,
      //   display: 'block',
      opacity: 1,
      scale: 1,
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      display: 'absolute',
      scale: 1,
      // x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    };
  },
};

/**
 * Experimenting with distilling swipe offset and velocity into a single variable, so the
 * less distance a user has swiped, the more velocity they need to register as a swipe.
 * Should accomodate longer swipes and short flicks without having binary checks on
 * just distance thresholds and velocity > 0.
 */
const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export interface CreateExperienceDialogProps extends DialogProps {
  noCloseBtn?: boolean;
  noShowContent?: boolean;
  closeOnOutsideClick?: boolean;
  contentProps?: DrawerContentProps;
  title?: string;
  content?: string;
  className?: string;
  mediaClassName?: string;
  selectedIndex?: number;
  showGeoMap?: boolean;
  collaborator?: USER_PROFILE_MODEL;
  media: ExperienceMediaModel[];
  experience?: ExperienceModel;
  videoAutoPlay?: boolean;
  handleOnClose: () => void;
}

export function ExperiencePostMediaGallery({
  open,
  children,
  className,
  mediaClassName,
  contentProps,
  media = [],
  selectedIndex = 0,
  noShowContent: noShowContentProp = false,
  showGeoMap: showGeoMapProp = false,
  noCloseBtn = false,
  videoAutoPlay = true,
  closeOnOutsideClick = false,
  title: titleProp = 'Experience Gallery',
  content: contentProp,
  collaborator,
  experience,
  handleOnClose,
  ...props
}: CreateExperienceDialogProps) {
  // console.log(`***** experience in ExperiencePostMediaGallery`, experience);
  const { overlayProps, ...contentRestProps } = contentProps || {};

  const imgRef = React.useRef<HTMLImageElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const mediaCount = media.length;
  const hasMultileMedia = mediaCount > 1;

  // Dialog States
  const [isOpen, setIsOpen] = React.useState(open);

  const [[page, direction], setPage] = React.useState([selectedIndex, 0]);

  // Media and Gallery
  // We only have 3 images, but we paginate them absolutely (ie 1, 2, 3, 4, 5...) and
  // then wrap that within 0-2 to find our image ID in the array below. By passing an
  // absolute page index as the `motion` component's `key` prop, `AnimatePresence` will
  // detect it as an entirely new image. So you can infinitely paginate as few as 1 images.
  const mediaIndex = wrap(0, mediaCount, page);
  const mediaItem = media[mediaIndex];
  const {
    id,
    url,
    caption,
    blurData,
    urlOriginal,
    aspectRatio: aspectRatioProp,
    extension,
    latitude,
    longitude,
  } = mediaItem || {};

  const [isMediaLoaded, setIsMediaLoaded] = React.useState(false);
  const [mediaIsPortrait, setMediaIsPortrait] = React.useState(false);
  const [mediaIsLandscape, setMediaIsLandscape] = React.useState(false);
  const [mediaIsWide, setMediaIsWide] = React.useState(false);
  const [mediaAspectRatio, setMediaAspectRatio] = React.useState<
    number | undefined | null
  >(aspectRatioProp);
  const [mediaWidth, setMediaWidth] = React.useState(0);
  const [mediaHeight, setMediaHeight] = React.useState(0);

  // Video specific states
  const [canPlayVideo, setCanPlayVideo] = React.useState(false);
  const [videoCurrenTime, setVideoCurrentTime] = useLocalStorage<number>(
    `video-current-time-${id}`,
    0
  );

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

  const paginate = (newDirection: number) => {
    // Only paginate if there are more than 1 media items
    if (hasMultileMedia) {
      setPage([page + newDirection, newDirection]);
    }
  };

  // Geo
  const mediaHasGeo = Boolean(latitude && longitude);
  const [showGeoMap, setShowGeoMap] = React.useState(showGeoMapProp);

  // Handlers
  const handleOnOpenChange = async (nextState: boolean) => {
    // Make sure to close the nested drawer if the primary drawer is closed
    if (!nextState && showGeoMap) {
      setShowGeoMap(false);
      await sleep(350);
    }

    setIsOpen(nextState);

    if (!nextState && typeof handleOnClose === 'function') {
      await sleep(350);
      handleOnClose();
    }
  };

  const handleOnEscapeKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleOnOpenChange(false);
    }
  };

  const handleClosePrimaryDrawer = () => {
    // setIsOpen(false);
    handleOnOpenChange(false);
  };

  const handleClosingNestedDrawer = () => {
    setShowGeoMap(false);
  };

  const handleOpeningNestedDrawer = () => {
    if (!mediaHasGeo) {
      return;
    }

    setShowGeoMap(true);
  };

  useKey(
    'ArrowRight',
    () => {
      if (hasMultileMedia) {
        const nextMediaIndex = wrap(0, mediaCount, page + 1);
        // Account for the case where the next media item may not have geo location
        if (showGeoMap) {
          const nextMediaItem = media[nextMediaIndex];
          const hasGeoLocation = Boolean(
            nextMediaItem.latitude && nextMediaItem.longitude
          );
          if (nextMediaItem && hasGeoLocation) {
            paginate(1);
          }
        } else {
          paginate(1);
        }
      }
    },
    { event: 'keyup' },
    [page, hasMultileMedia, showGeoMap, mediaCount]
  );

  useKey(
    'ArrowLeft',
    () => {
      if (hasMultileMedia) {
        const prevMediaIndex = wrap(0, mediaCount, page - 1);
        // Account for the case where the next media item may not have geo location
        if (showGeoMap) {
          const nextMediaItem = media[prevMediaIndex];
          const hasGeoLocation = Boolean(
            nextMediaItem.latitude && nextMediaItem.longitude
          );
          if (nextMediaItem && hasGeoLocation) {
            paginate(-1);
          }
        } else {
          paginate(-1);
        }
      }
    },
    { event: 'keyup' },
    [page, hasMultileMedia, showGeoMap, mediaCount]
  );

  useKey(
    'ArrowDown',
    () => {
      handleOnOpenChange(false);
    },
    { event: 'keyup' },
    []
  );

  // Content
  const expContent = contentProp || experience?.content;
  const prompt = experience?.Prompt?.prompt || '';
  const title = experience?.title || titleProp;
  const finalTitle = title;
  const userName = experience?.Author?.username || collaborator?.username || '';
  const userAvatar =
    experience?.Author?.avatar ||
    experience?.Author?.image ||
    collaborator?.avatar ||
    collaborator?.image ||
    '';
  const createdAt = experience?.createdAt;

  // Media Type
  const mediaIsImage = extension
    ? isImageExtension(extension)
    : isImage(urlOriginal || url);

  const mediaIsVideo = extension
    ? isVideoExtension(extension)
    : isVideo(urlOriginal || url);

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
        setMediaIsLandscape(false);
      } else {
        setMediaIsPortrait(false);
        setMediaIsLandscape(true);
      }

      // Wide
      if (isWideScreen(width, height)) {
        setMediaIsWide(true);
      }
    }
  };

  return (
    <Drawer
      key={'experience-post-media-gallery'}
      {...props}
      modal
      // handleOnly
      open={isOpen}
      // dismissible={false}
      shouldScaleBackground={false}
      onOpenChange={handleOnOpenChange}
      onClose={handleClosePrimaryDrawer}
    >
      <DrawerContent
        {...contentRestProps}
        onEscapeKeyDown={handleOnEscapeKeyDown}
        noCloseBtn={noCloseBtn || contentRestProps.noCloseBtn}
        overlayProps={{
          ...overlayProps,
          className: cn(
            'backdrop-blur-[2px] bg-transparent',
            overlayProps?.className
          ),
        }}
        className="max-h-[99svh] min-h-[98svh] bg-background/95 backdrop-blur-lg"
      >
        <DrawerHeader
          className={cn(
            'mx-auto flex max-w-4xl shrink flex-col flex-wrap pb-10 md:px-0 xl:max-w-5xl'
          )}
        >
          <DrawerTitle
            asChild
            className={cn(
              'flex items-center justify-center gap-2 text-center text-2xl font-semibold md:text-3xl lg:text-4xl lg:leading-normal',
              {
                'py-8': !prompt,
                'pb-4 pt-8': prompt,
              }
            )}
          >
            <h2>{finalTitle}</h2>
          </DrawerTitle>
          {prompt && (
            <DrawerTitle
              asChild
              className="text-center text-xl font-medium text-foreground/90 md:text-2xl"
            >
              <h3>{prompt}</h3>
            </DrawerTitle>
          )}
          {expContent && !noShowContentProp && (
            <DrawerDescription className="text-center text-base font-normal text-foreground/90 sm:text-center sm:text-lg">
              {expContent.length >= 180
                ? `${expContent.slice(0, 180)}...`
                : expContent}
            </DrawerDescription>
          )}
        </DrawerHeader>

        <motion.div
          data-vaul-no-drag
          key={page}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            delay: 0.0,
            delayChildren: 0.1,
            // x: {
            //   type: 'spring',
            //   stiffness: 500,
            //   damping: 30,
            //   duration: 0.125,
            // },
            // scale: { delay: 0, duration: 2 },
            opacity: { delay: 0, duration: 0.225 },
          }}
          drag={hasMultileMedia ? 'x' : false}
          dragConstraints={hasMultileMedia ? { left: 0, right: 0 } : undefined}
          dragElastic={hasMultileMedia ? 1 : undefined}
          onDragEnd={
            hasMultileMedia
              ? (e, { offset, velocity }) => {
                  const swipe = swipePower(offset.x, velocity.x);

                  if (swipe < -swipeConfidenceThreshold) {
                    paginate(1);
                  } else if (swipe > swipeConfidenceThreshold) {
                    paginate(-1);
                  }
                }
              : undefined
          }
          className={cn(
            'relative overflow-clip rounded-lg',
            'transition-all duration-300',
            'shrink grow',
            'mx-auto max-w-full xl:max-w-7xl',
            'flex items-center justify-center',
            {
              'opacity-0': !isMediaLoaded && !blurData,
              'opacity-100': isMediaLoaded,
              // Defaults
              'aspect-image': mediaIsImage,
              'aspect-video': mediaIsVideo,
              // Dynamic Overrides
              'aspect-image-portrait':
                mediaIsImage && mediaIsPortrait && !mediaIsWide,
              'aspect-image-portrait-wide':
                mediaIsImage && mediaIsPortrait && mediaIsWide,
              'aspect-image-landscape':
                mediaIsImage && mediaIsLandscape && !mediaIsWide,
              'aspect-image-landscape-wide':
                mediaIsImage && mediaIsLandscape && mediaIsWide,

              'aspect-video-portrait':
                mediaIsVideo && mediaIsPortrait && !mediaIsWide,
              'aspect-video-portrait-wide':
                mediaIsVideo && mediaIsPortrait && mediaIsWide,
              'aspect-video-landscape':
                mediaIsVideo && mediaIsLandscape && !mediaIsWide,
              'aspect-video-landscape-wide':
                mediaIsVideo && mediaIsLandscape && mediaIsWide,
            }
          )}
        >
          {!isMediaLoaded && !blurData && (
            <BlockSkeleton className="absolute inset-0 z-50 size-full rounded-lg" />
          )}
          <AnimatePresence initial={true} custom={direction}>
            {mediaIsImage && (
              <Image
                fill
                loading="lazy"
                key={`single-media-${id}-${mediaAspectRatio ? mediaAspectRatio : 'unknown'}`}
                // width={mediaIsLandscape ? imageLandscapeWidth : imagePortraitWidth}
                placeholder={blurData ? 'blur' : undefined}
                blurDataURL={blurData ? blurData : undefined}
                src={urlOriginal || url}
                // width={mediaWidth}
                // height={mediaHeight}
                alt={caption || 'User Media Asset'}
                className={cn(
                  'absolute top-0 my-0 max-h-full rounded-lg object-cover',
                  // {
                  //   'aspect-image-portrait': mediaIsPortrait,
                  //   'aspect-image-landscape': mediaIsLandscape,
                  // },
                  mediaClassName
                )}
                onLoad={async (img) => {
                  // Determine the aspect ratio of the image (if not provided)
                  const imgTarget = img.currentTarget;
                  const { height, width, naturalWidth, naturalHeight } =
                    imgTarget;

                  if (naturalHeight && naturalWidth) {
                    setMediaWidth(naturalWidth);
                    setMediaHeight(naturalHeight);
                  }

                  determineVideoAspectRatioAndOrientation(imgTarget);
                  await sleep(225);
                  setIsMediaLoaded(true);
                }}
              />
            )}
            {mediaIsVideo && (
              <video
                ref={videoRef}
                // initial={{ opacity: 0, scale: 0.1 }}
                // animate={{ opacity: 1, scale: 1 }}
                // transition={{ duration: 0.5 }}
                // exit={{ opacity: 0, scale: 0.1 }}
                loop
                muted
                controls
                playsInline
                autoPlay={videoAutoPlay}
                // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canplay_event
                onCanPlay={(e) => {
                  // console.log(`**** videoElement onCanPlay`, e);
                  setIsMediaLoaded(true);
                  determineVideoAspectRatioAndOrientation(e.currentTarget);
                  setCanPlayVideo(true);
                }}
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
                  'absolute top-0 my-0 max-h-full rounded-lg',
                  // {
                  //   'aspect-video-portrait': mediaIsPortrait,
                  //   'aspect-video-landscape': mediaIsLandscape,
                  // },
                  mediaClassName
                )}
              >
                <source src={urlOriginal || url} type="video/mp4" />
                <source src={urlOriginal || url} type="video/webm" />
                <source src={urlOriginal || url} type="video/ogg" />
              </video>
            )}
          </AnimatePresence>
          {mediaCount > 1 && (
            <div className="absolute top-1/2 z-20 flex w-full justify-between px-8">
              <Button
                type="button"
                className="size-[unset] rounded-full p-0.5 opacity-50 transition-opacity duration-150 hover:opacity-100"
                variant="default"
                size="icon"
                onClick={() => paginate(-1)}
              >
                <IconArrowLeft className="size-6" />
              </Button>
              <Button
                type="button"
                className="size-[unset] rounded-full p-0.5 opacity-50 transition-opacity duration-150 hover:opacity-100"
                variant="default"
                size="icon"
                onClick={() => paginate(1)}
              >
                <IconArrowLeft className="size-6 rotate-180" />
              </Button>
            </div>
          )}
        </motion.div>

        <DrawerFooter className="p-2 sm:p-4">
          <div
            className={cn(
              'flex flex-col items-start justify-between gap-4 sm:flex-row-reverse sm:items-center',
              {
                'flex-row justify-start': !experience,
              }
            )}
          >
            {userName && userAvatar && (
              <div className="flex items-center justify-center gap-2">
                {<UserAvatar src={userAvatar} alt={userName} />}
                <span className="truncate font-semibold text-foreground/90">
                  By @{userName}
                </span>
                {createdAt && (
                  <span className="truncate text-foreground/60">
                    {timeAgo(createdAt)}
                  </span>
                )}
              </div>
            )}
            {/* <Button
              variant="outline"
              size="sm"
              className={cn(
                'group gap-2 rounded-xl border-4 border-border/40 py-5 transition-colors duration-75 hover:text-success-foreground'
              )}
              onClick={handleOnCreateExperience}
              disabled={isFormProcessing}
            >
              <IconCirclePlus className="size-4 transition-transform duration-300 group-hover:rotate-180 group-hover:brightness-125" />
              <span>Create</span>
            </Button> */}
            <div className="flex gap-2.5">
              <Button
                size="sm"
                flavor="ring"
                variant="outline"
                onClick={() => {
                  handleOnOpenChange(false);
                }}
                className={cn(
                  'hover:text-success-foreground group gap-0 rounded-xl border-4 border-border/40 py-4 transition-colors duration-75'
                )}
              >
                <IconArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:brightness-125" />
                Back
              </Button>
              {mediaHasGeo && (
                <Button
                  type="button"
                  flavor="ring"
                  size="sm"
                  onClick={() => {
                    handleOpeningNestedDrawer();
                  }}
                  className="gap-1.5"
                >
                  <IconMapPinned className="size-4" />
                  Show on Map
                </Button>
              )}
            </div>
          </div>
        </DrawerFooter>

        {showGeoMap && (
          <DrawerNested
            nested
            open={showGeoMap}
            onOpenChange={async (nextState) => {
              // console.log(`DrawerNested onOpenChange`, { nextState });
              if (!nextState) {
                handleClosingNestedDrawer();
              }
            }}
          >
            <DrawerContent className="min-h-[94%]">
              <div className="mx-auto flex h-full min-h-full w-full grow flex-col items-center justify-center">
                <DrawerHeader
                  className={cn('mx-auto max-w-4xl shrink pb-10 md:px-0')}
                >
                  <DrawerTitle
                    asChild
                    className="flex items-center justify-center gap-2 truncate py-4 text-2xl font-semibold md:text-3xl lg:text-4xl"
                  >
                    <h3>Experience Media Map</h3>
                  </DrawerTitle>
                  {expContent && !noShowContentProp && (
                    <DrawerDescription className="text-center text-xl font-normal text-foreground/90">
                      asdf
                      {expContent}
                    </DrawerDescription>
                  )}
                </DrawerHeader>

                <div className={cn('grid h-full w-full max-w-156 grow')}>
                  <ExperienceMapClient
                    key={`experience-post-media-map-${id}`}
                    noRenderList
                    className="min-h-full rounded-md"
                    containerClassName="min-h-full grow"
                    //   mapContent={
                    //     !isAuthenticated ? <LoginToViewPhotoMapScreen /> : undefined
                    //   }
                    destinations={[
                      {
                        placeId: mediaItem.id,
                        coordinates: {
                          latitude: mediaItem.latitude || 0,
                          longitude: mediaItem.longitude || 0,
                        },
                        icon: mediaItem.thumbnail || undefined,
                        // title: mediaItem.caption || 'Media Asset',
                      },
                    ]}
                  />
                </div>

                <DrawerFooter className="flex w-full flex-row justify-between p-2 sm:p-4">
                  <Button
                    size="sm"
                    // flavor="ring"
                    variant="outline"
                    onClick={() => {
                      handleClosingNestedDrawer();
                    }}
                    className={cn(
                      'hover:text-success-foreground group gap-0 rounded-xl border-4 border-border/40 py-4 transition-colors duration-75'
                    )}
                  >
                    <IconArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:brightness-125" />
                    <span className="flex gap-1.5">
                      <span className="hidden md:inline-block">Back to</span>{' '}
                      <span>Gallery</span>
                    </span>
                  </Button>
                  {userName && userAvatar && (
                    <div className="flex items-center justify-center gap-2">
                      {<UserAvatar src={userAvatar} alt={userName} />}
                      <span className="truncate font-semibold text-foreground/90">
                        By @{userName}
                      </span>
                      {createdAt && (
                        <span className="truncate text-foreground/60">
                          {timeAgo(createdAt)}
                        </span>
                      )}
                    </div>
                  )}
                </DrawerFooter>
              </div>
            </DrawerContent>
          </DrawerNested>
        )}
      </DrawerContent>
    </Drawer>
  );
}
