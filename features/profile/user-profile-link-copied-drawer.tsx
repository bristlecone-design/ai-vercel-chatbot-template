'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import type { DialogProps } from '@radix-ui/react-dialog';
import { toast } from 'sonner';

import { getBaseUrl } from '@/lib/getBaseUrl';
import { makeUrlAbsolute, shortenUrl } from '@/lib/urls';
import { getUserInitialsFromName } from '@/lib/user/user-utils';
import { cn, sleep } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  type DrawerContentProps,
} from '@/components/ui/drawer';
import {
  IconHorizontalLink,
  IconImages,
  IconInfo,
  IconShare2,
} from '@/components/ui/icons';
import { SharedInfoTooltip } from '@/components/tooltip';
import { UserAvatar } from '@/components/user-avatar';

import { useUserProfile } from './user-profile-provider';

export function sharedToast(
  title: string,
  content?: string,
  icon?: React.ReactNode
) {
  return toast(
    <div className="flex w-full max-w-full gap-2">
      <span className="flex items-start gap-1.5">{icon || <IconInfo />}</span>
      <span className="flex flex-col items-start gap-1.5 leading-none">
        <span className="shrink">{title}</span>
        {content && (
          <span className="truncate brightness-50">
            {content.slice(0, 42)}...
          </span>
        )}
      </span>
    </div>
  );
}

export function useCanUseNativeMobileShare(isSupportedProp = false) {
  const [isSupported, setIsSupported] = React.useState(isSupportedProp);

  React.useEffect(() => {
    if (!isSupportedProp) {
      setIsSupported(Boolean(navigator.canShare?.()));
    }
  }, [isSupportedProp]);

  return isSupported;
}

export interface NativeMobileShareBtnProps
  extends React.ComponentProps<typeof Button> {
  url?: string;
  title: string;
  text?: string;
  files?: File[];
  isSupported?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
// https://w3c.github.io/web-share/demos/share-files.html
export function NativeMobileShareBtn({
  url,
  title,
  text,
  files,
  className,
  children,
  isSupported: isSupportedProp = false,
  ...props
}: NativeMobileShareBtnProps) {
  const isSupported = useCanUseNativeMobileShare(isSupportedProp);

  const pathname = usePathname();
  const urlToUse = url ? url : makeUrlAbsolute(`${getBaseUrl()}${pathname}`);
  // console.log('**** pathname and urlToUse', {
  //   pathname,
  //   urlToUse,
  //   isSupported,
  // });

  const handleOnShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url: urlToUse,
        files,
      });

      sharedToast('Profile shared');
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      variant="default"
      size="custom"
      className={cn('p-1.5', className)}
      onClick={handleOnShare}
    >
      <IconShare2 className="size-3" />
    </Button>
  );
}

export interface UserProfileLinkCopiedDrawer extends DialogProps {
  noCloseBtn?: boolean;
  numSharedAssets?: number;
  closeOnOutsideClick?: boolean;
  dontScaleBackground?: boolean;
  contentProps?: DrawerContentProps;
  titleClassName?: string;
  titleContent?: React.ReactNode;
  footerCtaLabel?: string;
  title?: React.ReactNode;
  content?: string;
  className?: string;
  contentClassName?: string;
  handleOnClose?: () => void;
}

export function UserProfileLinkCopiedDrawer({
  open,
  children,
  className,
  contentProps,
  noCloseBtn = false,
  closeOnOutsideClick = false,
  dontScaleBackground = false,
  numSharedAssets = 0,
  titleClassName,
  contentClassName,
  titleContent,
  footerCtaLabel = 'Back',
  title: titleProp = 'Profile Link Copied',
  content: contentProp,
  handleOnClose,
  ...props
}: UserProfileLinkCopiedDrawer) {
  const { overlayProps, ...contentRestProps } = contentProps || {};

  const { userProfile, profileExperiencesPermalink, profileUserFirstName } =
    useUserProfile();

  const {
    avatar: userAvatar,
    name: userName,
    url: userUrl,
    username: profileAddy,
    bio: userBio,
  } = userProfile || {};

  // Dialog States
  const [isOpen, setIsOpen] = React.useState(open);
  const { isCopied, copyToClipboard } = useCopyToClipboard({
    timeout: 3000,
  });
  const isNativeShareSupported = useCanUseNativeMobileShare();

  // Handlers
  const handleCopyingToClipboard = async () => {
    if (profileExperiencesPermalink) {
      const profileUrl = `${window.location.origin}${profileExperiencesPermalink}`;
      copyToClipboard(profileUrl);
      if (!isCopied) {
        sharedToast('Profile link copied', profileUrl);
      }
    } else {
      sharedToast('Failed to copy link: no profile permalink');
    }
  };

  const handleOnOpenChange = async (nextState: boolean) => {
    // console.log('**** handleOnOpenChange', { nextState });
    setIsOpen(nextState);

    if (nextState) {
      // Copy to clipboard
      handleCopyingToClipboard();
    }

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

  return isNativeShareSupported ? (
    <NativeMobileShareBtn
      title={`${userName}'s Profile - Experience NV`}
      text={userBio || ''}
    />
  ) : (
    <Drawer
      key={'experience-post-media-gallery'}
      {...props}
      modal
      // handleOnly
      open={isOpen}
      dismissible={false}
      shouldScaleBackground={!dontScaleBackground}
      onOpenChange={handleOnOpenChange}
      onClose={handleClosePrimaryDrawer}
    >
      <DrawerTrigger asChild>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleOnOpenChange(true);
          }}
          variant="default"
          size="custom"
          className="p-1.5"
        >
          <IconShare2 className="size-3" />
        </Button>
      </DrawerTrigger>
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
        className="max-h-[94svh] min-h-[94svh] bg-background/95 backdrop-blur-lg"
      >
        <div className="flex flex-col items-center justify-center gap-2 px-6 pb-20 pt-12 text-left sm:mx-auto sm:max-w-3xl md:pt-8">
          <DrawerHeader className="flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-8">
              <DrawerTitle className="flex items-center gap-1.5 text-center text-2xl lg:text-3xl">
                <IconHorizontalLink className="size-6" /> {titleProp}
              </DrawerTitle>
              <div className="flex flex-col items-center justify-center gap-2">
                <UserAvatar
                  src={userAvatar || ''}
                  initials={userName ? getUserInitialsFromName(userName) : ''}
                  alt="User Avatar"
                  className={cn('', className)}
                  fallbackClassName={cn('size-full text-xl')}
                  containerClassName={cn(
                    'size-24 md:size-28 sm:rounded-full bg-secondary border-4 border-tertiary'
                  )}
                />

                {(userName || profileAddy) && (
                  <div className="flex flex-col gap-1 leading-none">
                    {userName && (
                      <DrawerDescription className="text-center text-lg font-medium text-foreground">
                        {userName}
                      </DrawerDescription>
                    )}
                    {profileAddy && (
                      <DrawerDescription
                        asChild
                        className="flex w-full items-center justify-center gap-1.5 text-center text-base font-medium leading-none text-foreground/70"
                      >
                        <div>
                          {numSharedAssets > 0 && false && (
                            <SharedInfoTooltip
                              title="Shared Media"
                              content={`${profileUserFirstName} has shared ${numSharedAssets}  media assets`}
                            >
                              <Badge
                                variant="outline"
                                className="cursor-default gap-1"
                              >
                                <IconImages size-5 /> {numSharedAssets}
                              </Badge>
                            </SharedInfoTooltip>
                          )}
                          <span>@{profileAddy}</span>

                          {userUrl && (
                            <span className="flex gap-2">
                              <span className="text-foreground/40">/</span>
                              <a
                                target="_blank"
                                href={makeUrlAbsolute(userUrl)}
                                className="link-primary text-[inherit] no-underline"
                                rel="noreferrer"
                              >
                                {shortenUrl(userUrl)}
                              </a>
                            </span>
                          )}
                        </div>
                      </DrawerDescription>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DrawerHeader>
          <Button
            variant="tertiary"
            // size="sm"
            onClick={() => {
              handleClosePrimaryDrawer();
            }}
            className="w-full"
          >
            Cool
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
