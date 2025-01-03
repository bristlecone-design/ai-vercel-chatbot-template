'use client';

import * as React from 'react';
import type { PlaceWithMapMarkerLocationType } from '@/schemas/places/places-schemas';
import type { DialogProps } from '@radix-ui/react-dialog';

import { timeAgo } from '@/lib/datesAndTimes';
import { sortRawMediaForGallery } from '@/lib/media/media-utils';
import { cn, sleep } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  type DrawerContentProps,
} from '@/components/ui/drawer';
import { IconArrowLeft } from '@/components/ui/icons';
import { LoginToViewPhotoMapScreen } from '@/components/content/assets/preview-user-uploaded-images';
import {
  ExperienceMapClient,
  type ExperienceMapClientProps,
} from '@/components/maps/maps';
import { UserAvatar } from '@/components/user-avatar';

import { ExperienceMedia } from './experience-media';

import type {
  ExperienceMediaModel,
  ExperienceModel,
} from '@/types/experiences';

export interface ExperiencePostMapDrawerProps extends DialogProps {
  noCloseBtn?: boolean;
  closeOnOutsideClick?: boolean;
  contentProps?: DrawerContentProps;
  title?: string;
  content?: string;
  prompt?: string;
  noShowPrompt?: boolean;
  className?: string;
  isAuthenticated?: boolean;
  mediaContainerClassName?: string;
  destinations?: ExperienceMapClientProps['destinations'];
  experience: ExperienceModel;
  handleOnClose?: () => void;
}

export function ExperiencePostMapDrawer({
  noCloseBtn = false,
  closeOnOutsideClick = false,
  noShowPrompt = false,
  title: titleProp = 'Experience Map',
  mediaContainerClassName,
  content,
  prompt = '',
  destinations: destinationsProp = [],
  experience,
  contentProps,
  className,
  children,
  open = true,
  isAuthenticated,
  handleOnClose,
  ...props
}: ExperiencePostMapDrawerProps) {
  const { overlayProps, ...contentRestProps } = contentProps || {};

  // States
  const [isOpen, setIsOpen] = React.useState(open);
  const [experienceCreated, setExperienceCreated] = React.useState(false);
  const [isFormProcessing, setIsFormProcessing] = React.useState(false);

  // Refs
  const formRef = React.useRef<HTMLFormElement>(null);
  const nestedDrawerCloseRef = React.useRef<HTMLButtonElement>(null);

  // Handlers
  const handleOnOpenChange = async (nextState: boolean) => {
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

  const { Media } = experience;

  // Sort media by those that have latitude and longitude first
  const expSortedMedia = Media?.length
    ? Media.sort((a, b) => {
        if (a.latitude && a.longitude) {
          return -1;
        }
        if (b.latitude && b.longitude) {
          return 1;
        }
        return 0;
      })
    : [];

  // Map valid destinations then sort by the order of the destinations
  const destinations = expSortedMedia.length
    ? (expSortedMedia
        .map((media) => {
          const { latitude, longitude } = media;
          if (latitude && longitude) {
            return {
              placeId: media.id,
              coordinates: { latitude, longitude },
              icon: media.thumbnail || undefined,
              title: media.caption || 'User Media Asset',
            } as PlaceWithMapMarkerLocationType;
          }
          return null;
        })
        .filter(Boolean) as ExperienceMapClientProps['destinations'])
    : destinationsProp;

  if (!destinations || destinations.length === 0) {
    return null;
  }

  // Content
  const isPromptChallenge = Boolean(experience?.prompt) && experience?.promptId;
  const expContent = content || experience?.content;
  const title = isPromptChallenge
    ? 'Prompt Challenge Map'
    : experience?.title || titleProp;
  const userName = experience?.Author?.username || '';
  const userAvatar = experience?.Author?.avatar || experience?.Author?.image;
  const createdAt = experience?.createdAt;

  // Assets
  // Sort media by those that have latitude and longitude first
  const mediaAssets = experience?.Media || [];

  const sortedMedia = sortRawMediaForGallery<ExperienceMediaModel[]>(
    mediaAssets,
    true
  );

  const hasMediaAssets = Boolean(sortedMedia.length);
  // console.log(`ExperiencePostMapDrawer: mediaAssets`, mediaAssets);

  return (
    <Drawer
      {...props}
      modal
      // handleOnly
      open={isOpen}
      // dismissible={false}
      shouldScaleBackground={false}
      onOpenChange={handleOnOpenChange}
      // disablePreventScroll
      // onClose={() => {
      //   console.log('onClose invoked');
      //   handleClosePrimaryDrawer();
      // }}
      // onRelease={(e) => {
      //   console.log('onRelease invoked', e);
      // }}
    >
      <DrawerContent
        {...contentRestProps}
        onEscapeKeyDown={handleOnEscapeKeyDown}
        onInteractOutside={(e) => {
          // console.log('onInteractOutside', e, { closeOnOutsideClick });
          e.preventDefault();
          e.stopPropagation();
        }}
        noCloseBtn={noCloseBtn || contentRestProps.noCloseBtn}
        onFocusOutside={(e) => {
          console.log('onFocusOutside', e, { closeOnOutsideClick });
          if (closeOnOutsideClick) {
            setIsOpen(false);
          } else {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        overlayProps={{
          ...overlayProps,
          className: cn(
            'backdrop-blur-[2px] bg-transparent',
            overlayProps?.className
          ),
        }}
        className="max-h-[99svh] min-h-[96svh] bg-background/95 backdrop-blur-lg"
      >
        <DrawerHeader
          className={cn(
            'mx-auto flex max-w-4xl shrink flex-col flex-wrap pb-10 md:px-0'
          )}
        >
          <DrawerTitle
            asChild
            className="flex items-center justify-center gap-2 py-8 text-center text-2xl font-semibold md:text-3xl lg:text-4xl"
          >
            <h2>
              {/* <IconMapPinned className="size-5" /> */}
              <span className="">{title}</span>
            </h2>
          </DrawerTitle>
          {expContent && (
            <DrawerDescription className="text-center text-base font-normal text-foreground/90 sm:text-xl">
              {expContent.length > 225
                ? `${expContent.slice(0, 225)}...`
                : expContent}
            </DrawerDescription>
          )}
        </DrawerHeader>

        <div
          className={cn(
            'mx-auto grid w-full max-w-156 grow gap-4 overflow-auto'
          )}
        >
          <ExperienceMapClient
            noRenderList
            className="h-[200px] rounded-md sm:min-h-full"
            mapContent={
              !isAuthenticated ? <LoginToViewPhotoMapScreen /> : undefined
            }
            destinations={destinations}
            initialZoomOverride={
              isAuthenticated && destinations.length === 1 ? 16 : undefined
            }
          />
          {hasMediaAssets && (
            <div className="w-full max-w-full">
              <ExperienceMedia
                showIndividualMapIcon
                media={sortedMedia}
                className="h-24 min-h-24 sm:max-h-32 sm:min-h-32"
              />
            </div>
          )}
        </div>

        <DrawerFooter className="p-2 sm:p-4">
          <div className="flex flex-row-reverse items-center justify-between gap-4">
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
              size="lg"
              className={cn(
                'group gap-2 rounded-xl border-4 border-border/40 py-5 transition-colors duration-75 hover:text-success-foreground'
              )}
              onClick={handleOnCreateExperience}
              disabled={isFormProcessing}
            >
              <IconCirclePlus className="size-5 transition-transform duration-300 group-hover:rotate-180 group-hover:brightness-125" />
              <span>Create</span>
            </Button> */}
            <Button
              variant="outline"
              size="lg"
              className={cn(
                'group gap-0 rounded-xl border-4 border-border/40 py-5 transition-colors duration-75 hover:text-success-foreground'
              )}
              onClick={() => handleOnOpenChange(false)}
              disabled={isFormProcessing}
              // tabIndex={-1}
            >
              <IconArrowLeft className="size-5 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:brightness-125" />
              <span>Back</span>
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
