'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clearPathCache } from '@/actions/cache';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';

import {
  formatDateFromPostgresString,
  formatDateLegacy,
} from '@/lib/datesAndTimes';
import {
  updateMediaDownloadable,
  updateMediaPublicVisibility,
  updateMediaRemixable,
} from '@/lib/db/queries/media/update-core-media';
import {
  isImage,
  isImageExtension,
  isVideo,
  isVideoExtension,
} from '@/lib/media/media-utils';
import { makeUrlAbsolute, shortenUrl } from '@/lib/urls';
import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Badge } from '@/components/ui/badge';
import {
  Button,
  buttonVariants,
  type ButtonProps,
} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  IconCheck,
  IconDownload,
  IconDownloadImage,
  IconEdit,
  IconExpand,
  IconExpandRightArrow,
  IconExternalLink,
  IconEyeClosed,
  IconEyeViewSimple,
  IconFileUpload,
  IconHorizontalLink,
  IconImage,
  IconInfo,
  IconMapPin,
  IconRemix1,
  IconSpinner,
} from '@/components/ui/icons';
import { Label } from '@/components/ui/label';
import { BlockSkeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { MediaUpdateForm } from '@/components/auth/media/media-update-form';
import { GeneralDialog } from '@/components/dialog-general';
import { GeneralDrawer } from '@/components/drawer-general';
import ImageMedium from '@/components/image/image-medium';
import { ExperienceMapClient } from '@/components/maps/maps';
import { Prose } from '@/components/prose';
import { BaseTooltip, BaseTooltipContent } from '@/components/tooltip';
import { UserAvatar } from '@/components/user-avatar';

import type { PhotoAuthor, PhotoBasicExifData } from '@/types/photo';

//Spring animation parameters
const spring = {
  type: 'spring',
  stiffness: 350,
  damping: 80,
};

export function AssetStaffPick({
  label = 'Staff Pick',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-lime-400/15 bg-lime-800/30 text-xs text-foreground/80 backdrop-blur-sm transition-colors duration-150 hover:border-lime-400/25 hover:bg-lime-800/50',
        className
      )}
    >
      {label}
    </Badge>
  );
}

export function LoginToViewPhotoMapScreen({
  ctaLabel = 'Login to View Photo Map',
  ctaVariant = 'default',
  ctaSize = 'default',
  className,
}: {
  ctaLabel?: string;
  ctaVariant?: ButtonProps['variant'];
  ctaSize?: ButtonProps['size'];
  className?: string;
}) {
  return (
    <div className="absolute inset-0 flex size-full items-center justify-center backdrop-blur-lg">
      <Link
        href="/login"
        className={cn(
          'transition-all duration-300',
          buttonVariants({
            variant: ctaVariant,
            size: ctaSize,
          }),
          'bg-orange-600 text-foreground',
          'hover:bg-orange-800 hover:text-foreground',
          'no-underline',
          className
        )}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

export type CopyTextProps = {
  text: string;
  copiedTextLabel?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
} & ButtonProps;

export function CopyText({
  className,
  disabled,
  text,
  children,
  copiedTextLabel = 'Copied text to clipboard',
}: CopyTextProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const onCopy = () => {
    if (isCopied) return;
    copyToClipboard(text);
    toast.success(copiedTextLabel);
  };

  if (!text) {
    return null;
  }

  return (
    <Button
      size="custom"
      variant="ghost"
      onClick={onCopy}
      disabled={disabled}
      className={cn('relative gap-1.5 p-0 hover:bg-transparent', className)}
    >
      {isCopied ? <IconCheck className="absolute -left-6 size-4" /> : null}
      <span className="sr-only">Copy to clipboard</span>
      {children || text}
    </Button>
  );
}

interface CopyUploadedAssetLinkProps extends ButtonProps {
  id: string;
  basePath?: string;
  openInNewTab?: boolean;
  label?: string;
  disabled?: boolean;
  noTooltip?: boolean;
}

export function CopyUploadedAssetLink({
  id,
  noTooltip = false,
  basePath = '/featured/photo',
  openInNewTab = false,
  disabled,
  label,
  ...props
}: CopyUploadedAssetLinkProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const onCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCopied) return;
    const mediaPath = `${basePath}/${id}`;
    const origin = new URL(window.location.href).origin;
    const fullMediaPath = `${origin}${mediaPath}`;
    copyToClipboard(fullMediaPath);
    toast.success('Copied photo permalink to clipboard');

    if (openInNewTab) {
      window.open(fullMediaPath, '_blank');
    }
  };

  return (
    <BaseTooltip
      content={
        noTooltip ? (
          ''
        ) : (
          <BaseTooltipContent
            // title="Summary of Media Info"
            content="Copy/View Media Permalink"
          />
        )
      }
    >
      <Button
        size="custom"
        variant="ghost"
        onClick={onCopy}
        {...props}
        disabled={disabled}
        className={cn('gap-1.5', props.className)}
      >
        {isCopied ? (
          <IconCheck />
        ) : openInNewTab ? (
          <IconExternalLink />
        ) : (
          <IconHorizontalLink />
        )}
        <span className="sr-only">Copy Uploaded Media Permalink</span>
        {label}
      </Button>
    </BaseTooltip>
  );
}

interface EditAssetBtnProps extends ButtonProps {
  id?: string;
  disabled?: boolean;
  tooltipContent?: string;
  handleOnEditAsset?: () => void;
}

export function EditAssetBtn({
  id,
  disabled,
  tooltipContent = 'Edit',
  handleOnEditAsset,
  ...props
}: EditAssetBtnProps) {
  return (
    <BaseTooltip content={tooltipContent}>
      <Button
        size="custom"
        variant="ghost"
        disabled={disabled}
        className={cn('p-1', props.className)}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (typeof handleOnEditAsset === 'function') {
            handleOnEditAsset();
          }
        }}
        {...props}
      >
        <IconEdit />
        <span className="sr-only">Edit Media</span>
      </Button>
    </BaseTooltip>
  );
}

export type DownloadUploadedAssetLinkProps = {
  id?: string;
  url: string;
  label?: string;
  usageNotes?: string;
  filename?: string;
  authorName?: string;
  authenticated?: boolean;
  downloadable?: boolean;
  labelClassName?: string;
  disabled?: boolean;
};

export function DownloadUploadedAssetLink({
  id,
  url,
  usageNotes,
  labelClassName,
  label = 'Download',
  filename = `Experience NV User Photo`,
  downloadable = false,
  authenticated,
  authorName,
  disabled,
}: DownloadUploadedAssetLinkProps) {
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isDownloaded, setIsDownloaded] = React.useState(false);

  const handleDownload = async () => {
    if (!authenticated) {
      toast.error('You need to be logged in to download this photo');
      return;
    } else if (!downloadable) {
      toast.error(
        'This photo is not currently available for download per the author'
      );
      return;
    }

    setIsDownloading(true);

    const urlObject = new URL(url);
    const newUrl = `${urlObject.origin}${urlObject.pathname}`;
    const response = await fetch(newUrl);
    const blob = await response.blob();
    const extensionFromUrl = newUrl.split('.').pop();
    const fileType = blob.type;
    const fileExtension = (
      extensionFromUrl || fileType.split('/')[1]
    ).toLocaleLowerCase();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `${filename} - ${new Date().toISOString()}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    // window.URL.revokeObjectURL(objectUrl);
    setIsDownloading(false);
    setIsDownloaded(true);
  };

  return (
    <BaseTooltip
      content={
        isDownloaded
          ? ''
          : downloadable
            ? 'Download Media'
            : 'Not Available for Download'
      }
      container={
        isDownloaded && sheetRef.current ? sheetRef.current : undefined
      }
    >
      <div>
        <Button
          size="custom"
          variant="ghost"
          className="p-1"
          disabled={isDownloading || disabled}
          onClick={(e) => {
            if (isDownloaded) {
              return;
            }
            e.preventDefault();
            e.stopPropagation();
            handleDownload();
          }}
        >
          {isDownloading && <IconSpinner className="" />}
          {!isDownloading && <IconDownloadImage className="" />}
          <span className={cn('hidden', labelClassName)}>{label}</span>
        </Button>
        {isDownloaded && (
          <Drawer
            open
            shouldScaleBackground
            setBackgroundColorOnScale
            direction="bottom"
            onOpenChange={(nextState) => setIsDownloaded(nextState)}
          >
            <DrawerContent
              // container={document.body}
              // sheetOverlayClassName="bg-black/40"
              className="h-[76lvh] bg-transparent backdrop-blur-md"
              // side="right"

              ref={sheetRef}
            >
              <DrawerHeader className="flex flex-col items-center justify-center gap-8 px-6 pb-20 pt-12 text-left sm:mx-auto sm:max-w-3xl md:pt-8">
                <div className="flex flex-col items-center justify-center gap-2">
                  <DrawerTitle className="text-2xl lg:text-3xl">
                    🎉 {'Photo Downloaded'}
                  </DrawerTitle>
                  <DrawerDescription className="text-base">
                    Enjoy and please credit{' '}
                    {authorName ? (
                      <>
                        <strong>{authorName}</strong>
                      </>
                    ) : (
                      'the author'
                    )}{' '}
                    when using their sweet media asset in your projects.
                  </DrawerDescription>
                  {usageNotes && false && (
                    <DrawerDescription>{usageNotes}</DrawerDescription>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="tertiary"
                    onClick={() => {
                      setIsDownloaded(false);
                    }}
                  >
                    Thanks!
                  </Button>
                  {/* <DrawerDescription className="text-base">
                  Enjoy both the media asset and all that{' '}
                  <strong>Nevada and its people have to offer!</strong>
                </DrawerDescription> */}
                  {id && (
                    <BaseTooltip content="">
                      <div className="flex w-full flex-row items-start gap-2 py-4">
                        <Link
                          href="/"
                          className={cn(
                            buttonVariants({
                              variant: 'default',
                              size: 'custom',
                            }),
                            'gap-1.5 px-2 py-1.5 text-sm font-medium leading-none lg:px-2.5 lg:py-2'
                          )}
                        >
                          <IconFileUpload />
                          Upload Your Own
                        </Link>
                        <CopyUploadedAssetLink
                          // openInNewTab
                          noTooltip
                          id={id}
                          variant="default"
                          size="custom"
                          className="gap-1.5 px-2 py-1.5 text-sm font-medium leading-none lg:px-2.5 lg:py-2"
                          label="Media Permalink"
                        />
                      </div>
                    </BaseTooltip>
                  )}
                </div>
              </DrawerHeader>
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </BaseTooltip>
  );
}

export type PreviewAssetToggleSwitchProps = {
  id: string;
  active: boolean;
  disabled?: boolean;
  tooltipContent?: React.ReactNode;
  activeIcon?: React.ReactNode;
  inactiveIcon?: React.ReactNode;
  children?: React.ReactNode;
  handleOnToggleVisibility?: (nextState: boolean) => void;
};

export function PreviewAssetToggleSwitch({
  id,
  active: activeProp,
  disabled = false,
  tooltipContent = '',
  activeIcon,
  inactiveIcon,
  children,
  handleOnToggleVisibility,
}: PreviewAssetToggleSwitchProps) {
  const switchRef = React.useRef<HTMLButtonElement>(null);

  const handlePublicToggle = async (nextState: boolean) => {
    if (typeof handleOnToggleVisibility === 'function') {
      handleOnToggleVisibility(nextState);
    }
  };

  return (
    <BaseTooltip content={tooltipContent}>
      <Label
        htmlFor={id}
        className={cn('flex items-center space-x-1 text-tiny', {
          'cursor-pointer': !disabled,
        })}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (switchRef.current) {
            // switchRef.current.click();
            // e.stopPropagation();
            // e.preventDefault();
          }
        }}
      >
        {activeProp && activeIcon}
        {!activeProp && inactiveIcon}
        <Switch
          ref={switchRef}
          id={id}
          name={id}
          className="h-3.5 w-6"
          thumbClassName="size-3 data-[state=checked]:translate-x-2 data-[state=unchecked]:-translate-x-0"
          value={activeProp ? 1 : 0}
          checked={activeProp}
          disabled={disabled}
          onCheckedChange={(state) => {
            handlePublicToggle(state);
          }}
        />
      </Label>
    </BaseTooltip>
  );
}

export type PreviewSingleAssetContainerProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
};

export function PreviewSingleAssetContainer({
  children,
  className,
  onClick,
}: PreviewSingleAssetContainerProps) {
  return (
    // biome-ignore lint/nursery/noStaticElementInteractions: <explanation>
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      onClick={onClick}
      className={cn(
        'relative h-full min-h-80 w-full overflow-clip sm:rounded-md',
        className
      )}
    >
      {children}
    </div>
  );
}

export function PreviewUploadedAssetsContainer({
  children,
  className,
  noUseDefaultColumns = false,
}: {
  children: React.ReactNode;
  className?: string;
  noUseDefaultColumns?: boolean;
}) {
  const baseClx = !noUseDefaultColumns
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    : '';

  return (
    <div className={cn('grid gap-2 p-1', baseClx, className)}>{children}</div>
  );
}

export function PreviewUploadedAssetsLoadingLayout({
  numItems = 9,
}: {
  numItems?: number;
}) {
  return (
    <PreviewUploadedAssetsContainer>
      {[...Array(numItems)].map((_, index) => (
        <PreviewSingleAssetContainer key={`loading-asset-${index}`}>
          <BlockSkeleton as="div" className="size-full" />
        </PreviewSingleAssetContainer>
      ))}
    </PreviewUploadedAssetsContainer>
  );
}

export type EditSingleAssetInfoDialogProps = {
  open?: boolean;
  title?: string;
  children?: React.ReactNode;
  handleOnClose: (nextState: boolean) => void;
};

export function EditSingleAssetInfoDialog({
  open = false,
  title = 'Edit Media Info',
  children,
  handleOnClose,
}: EditSingleAssetInfoDialogProps) {
  return (
    <GeneralDialog
      open={open}
      title={title}
      footerCtaLabel="Back"
      onClose={(nextState = false) => handleOnClose(nextState)}
      closeBtnClassName=""
      closeBtnVariant="outline"
      contentClassName="flex flex-col min-w-[96%] max-w-full sm:min-w-[60%] lg:min-w-[40%] min-h-full sm:min-h-[60%] sm:max-w-[60%] lg:max-w-[40%] max-h-full"
      contentInnerClassName="flex"
    >
      <div className="relative w-full max-w-full">{children}</div>
    </GeneralDialog>
  );
}

export type PreviewSingleAssetInfoDialogProps = {
  open?: boolean;
  title?: string;
  isStaffPick?: boolean;
  children?: React.ReactNode;
  footerClassName?: string;
  handleOnClose: (nextState: boolean) => void;
  handleOnEditAsset?: () => void;
};

export function PreviewSingleAssetInfoDialog({
  open = false,
  title = 'Media Info',
  isStaffPick,
  footerClassName,
  children,
  handleOnClose,
  handleOnEditAsset,
}: PreviewSingleAssetInfoDialogProps) {
  return (
    <GeneralDialog
      open={open}
      title={title}
      titleContent={isStaffPick && <AssetStaffPick />}
      titleClassName={isStaffPick ? '' : ''}
      footerCtaLabel="Back"
      footerClassName={footerClassName}
      footerContent={
        typeof handleOnEditAsset === 'function' ? (
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              handleOnEditAsset();
            }}
          >
            Edit
          </Button>
        ) : undefined
      }
      onClose={(nextState = false) => handleOnClose(nextState)}
      closeBtnClassName=""
      closeBtnVariant="outline"
      contentClassName="flex flex-col min-w-[96%] max-w-full sm:min-w-[60%] lg:min-w-[40%] min-h-full sm:min-h-[60%] sm:max-w-[60%] lg:max-w-[40%] max-h-full"
      contentInnerClassName="flex p-0 overflow-hidden"
    >
      <div className="relative w-full overflow-y-auto">{children}</div>
    </GeneralDialog>
  );
}

export type PreviewSingleAssetExifDataProps = {
  id: string;
  usageNotes?: string;
  exif: PhotoBasicExifData['exif'];
  thumbnail: PhotoBasicExifData['thumbnail'];
  author?: PhotoAuthor | null;
  positionAbsolute?: boolean;
  headingClassName?: string;
  className?: string;
  noMapIcon?: boolean;
  noModelName?: boolean;
  noMakeName?: boolean;
  noShowDateTaken?: boolean;
  displayAuthorName?: boolean;
  openPermalinkInNewTab?: boolean;
  displayDownload?: boolean;
  downloadUrl?: string;
  remixable?: boolean;
  downloadable?: boolean;
  isStaffPick?: boolean;
  isAuthenticated?: boolean;
  displayEdit?: boolean;
  enabledEdit?: boolean;
  enableDownloadToggle?: boolean;
  enableRemixToggle?: boolean;
  enablePublicToggle?: boolean;
  publiclyVisible?: boolean;
  noShowEditFeatures?: boolean;
  ctaElement?: React.ReactNode;
  handleFlippingImage?: () => void;
  handleOpeningDialog?: () => void;
  handleEditingAsset?: () => void;
  handleTogglingRemixability?: (nextState: boolean) => void;
  handleTogglingVisibility?: (nextState: boolean) => void;
  handleTogglingDownloadable?: (nextState: boolean) => void;
  handleTogglingInfoScreen?: () => void;
};

export function PreviewSingleAssetExifData({
  id,
  exif,
  author,
  isStaffPick,
  usageNotes,
  thumbnail,
  className,
  headingClassName,
  positionAbsolute,
  noMapIcon = false,
  noModelName = false,
  noMakeName = false,
  noShowDateTaken = true,
  isAuthenticated = false,
  displayAuthorName = false,
  openPermalinkInNewTab = false,
  displayDownload = true,
  displayEdit = true,
  enabledEdit = true,
  enableDownloadToggle = true,
  enablePublicToggle = true,
  enableRemixToggle = true,
  remixable: remixableProp = false,
  downloadable: downloadableProp = false,
  publiclyVisible: publiclyVisibleProp = false,
  noShowEditFeatures = false,
  downloadUrl,
  ctaElement,
  handleFlippingImage,
  handleOpeningDialog,
  handleEditingAsset,
  handleTogglingVisibility,
  handleTogglingRemixability,
  handleTogglingDownloadable,
  handleTogglingInfoScreen,
}: PreviewSingleAssetExifDataProps) {
  const {
    iso,
    make,
    model,
    takenAt,
    fNumber,
    takenAtNaive,
    focalLength35,
    aspectRatio,
    latitude,
    longitude,
  } = exif;

  const hasBasicExifData = iso || make || model || takenAt || fNumber;

  const hasGeoData = latitude && longitude;

  const {
    path: thumbnailBase64,
    width: thumbnailWidth,
    height: thumbnailHeight,
  } = thumbnail || {};

  const {
    name: authorName,
    avatar: authorAvatar,
    image: authorImage,
    username: authorUsername,
  } = author || {};

  const authorImgUrl = authorAvatar || authorImage || '';

  // const hasThumbnail = thumbnailBase64 && thumbnailWidth && thumbnailHeight;

  const positionAbsoluteClass = positionAbsolute
    ? 'absolute bottom-1 left-1 right-1 '
    : '';

  return (
    <div
      className={cn(
        'flex flex-col gap-0.5 rounded-sm leading-none backdrop-blur-md',
        positionAbsoluteClass,
        className
      )}
    >
      {(id ||
        make ||
        model ||
        hasGeoData ||
        displayDownload ||
        isStaffPick) && (
        <h3
          className={cn(
            'flex w-full items-center justify-between bg-muted/35 px-2 py-1.5 text-sm font-medium leading-none',
            '@container/asset-controls',
            headingClassName
          )}
        >
          <span className="flex items-center gap-2">
            {isStaffPick && <AssetStaffPick label="Staff Pick" />}
            <span className="truncate">
              {!noMakeName && make} {!noModelName && model}
            </span>
          </span>

          <span className="flex items-center gap-2 @[300px]/asset-controls:gap-3">
            {!noMapIcon && hasGeoData && (
              <Button
                variant="ghost"
                size="custom"
                className="hidden p-1 @[300px]/asset-controls:flex"
                onClick={
                  handleFlippingImage
                    ? (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleFlippingImage();
                      }
                    : undefined
                }
              >
                <IconMapPin />
              </Button>
            )}

            {!noShowEditFeatures && (
              <React.Fragment>
                {displayEdit && (
                  <EditAssetBtn
                    disabled={!enabledEdit}
                    handleOnEditAsset={handleEditingAsset}
                  />
                )}
              </React.Fragment>
            )}

            {id && (
              <CopyUploadedAssetLink
                id={id}
                size="custom"
                className="p-1"
                // disabled={!publiclyVisibleProp}
                openInNewTab={openPermalinkInNewTab}
              />
            )}

            {displayDownload && (
              <DownloadUploadedAssetLink
                id={id}
                url={downloadUrl || ''}
                usageNotes={usageNotes}
                authenticated={isAuthenticated}
                authorName={authorName ? authorName : undefined}
                downloadable={downloadableProp}
                disabled={!downloadableProp}
                filename={
                  authorName
                    ? `Experience NV Photo by ${authorName}`
                    : undefined
                }
              />
            )}

            {!noShowEditFeatures && (
              <React.Fragment>
                <PreviewAssetToggleSwitch
                  id={`publicly-remixable-${id}`}
                  activeIcon={<IconRemix1 className="" />}
                  inactiveIcon={<IconRemix1 className="text-foreground/60" />}
                  active={remixableProp}
                  disabled={!enableRemixToggle}
                  tooltipContent={
                    <BaseTooltipContent
                      title={`Remixable (${remixableProp ? 'Enabled' : 'Disabled'})`}
                      content="When enabled, users can combine content within the platform for marketing, promotion and fun purposes."
                    />
                  }
                  handleOnToggleVisibility={handleTogglingRemixability}
                />
              </React.Fragment>
            )}

            {!noShowEditFeatures && (
              <React.Fragment>
                <PreviewAssetToggleSwitch
                  id={`publicly-downloadable-${id}`}
                  activeIcon={<IconDownload className="" />}
                  inactiveIcon={<IconDownload className="text-foreground/60" />}
                  active={downloadableProp}
                  disabled={!enableDownloadToggle}
                  tooltipContent={
                    <BaseTooltipContent
                      title={`Downloadable (${downloadableProp ? 'Enabled' : 'Disabled'})`}
                      content="When enabled, users can view media content on the platform in various contexts."
                    />
                  }
                  handleOnToggleVisibility={handleTogglingDownloadable}
                />
              </React.Fragment>
            )}

            {!noShowEditFeatures && (
              <React.Fragment>
                <PreviewAssetToggleSwitch
                  id={`publicly-visible-${id}`}
                  activeIcon={<IconEyeViewSimple />}
                  inactiveIcon={
                    <IconEyeClosed className="text-foreground/60" />
                  }
                  active={publiclyVisibleProp}
                  disabled={!enablePublicToggle}
                  tooltipContent={
                    <BaseTooltipContent
                      title={`Publicly Visible (${publiclyVisibleProp ? 'Enabled' : 'Disabled'})`}
                      content="When enabled, users can view media content on the platform in various contexts."
                    />
                  }
                  handleOnToggleVisibility={handleTogglingVisibility}
                />
              </React.Fragment>
            )}

            {handleTogglingInfoScreen && (
              <BaseTooltip
                content={
                  <BaseTooltipContent
                    // title="Summary of Media Info"
                    content="Summary of Media Info"
                  />
                }
              >
                <Button
                  size="custom"
                  variant="ghost"
                  className="p-1"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTogglingInfoScreen();
                  }}
                >
                  <IconInfo />
                </Button>
              </BaseTooltip>
            )}

            {handleOpeningDialog && (
              <Button
                size="custom"
                variant="ghost"
                className="p-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpeningDialog();
                }}
              >
                <IconExpand />
              </Button>
            )}
          </span>
        </h3>
      )}
      <div className="flex flex-row items-center justify-between gap-2 p-1 text-xs">
        <div className="flex flex-col items-start gap-2 md:justify-between">
          {(focalLength35 || fNumber || iso) && (
            <span className="flex gap-2.5">
              {focalLength35 && <span>{focalLength35}mm</span>}
              {fNumber && <span>ƒ{fNumber}</span>}
              {iso && <span className="">ISO {iso}</span>}
            </span>
          )}
          {(takenAt || takenAtNaive) && !noShowDateTaken && (
            <span className="rounded-md border border-border/20 bg-foreground/25 px-1 py-0.5 text-background/60 transition-colors duration-150 hover:bg-foreground/40">
              {formatDateFromPostgresString(
                takenAtNaive || takenAt || '',
                'short'
              )}
            </span>
          )}
        </div>
        {ctaElement}
        {displayAuthorName && authorName && (
          <div className="flex items-center gap-1.5">
            {authorImgUrl && (
              <UserAvatar
                src={authorImgUrl}
                alt={`${authorName} profile image`}
                containerClassName="size-7"
                className="border-2"
              />
            )}
            <div className="flex flex-col leading-normal">
              <span className="text-foreground/60">Uploaded by</span>{' '}
              {!authorUsername && (
                <span className="font-medium">{authorName}</span>
              )}
              {authorUsername && (
                <Link
                  href={`/profile/${authorUsername}`}
                  className="link-primary font-medium"
                >
                  {authorName}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export type PreviewSingleUploadedAssetsProps = {
  author?: PhotoAuthor | null;
  asset: PhotoBasicExifData;
  className?: string;
  dialogTitle?: React.ReactNode;
  displayAuthorName?: boolean;
  displayModelName?: boolean;
  displayExpandInMeta?: boolean;
  displayBlurData?: boolean;
  displayDownload?: boolean;
  noShowAnyMeta?: boolean;
  noShowTitle?: boolean;
  noShowCaption?: boolean;
  displayDateTaken?: boolean;
  openPermalinkInNewTab?: boolean;
  isAuthenticated?: boolean;
  enabledEdit?: boolean;
  noShowEditFeatures?: boolean;
  ctaElement?: React.ReactNode;
  enableSelecting?: boolean;
  isSelected?: boolean;
  handleOnSelectAsset?: (nextState: boolean, asset: PhotoBasicExifData) => void;
};

export function PreviewSingleUploadedAssets({
  author,
  asset,
  className,
  dialogTitle,
  displayAuthorName = false,
  displayModelName = false,
  displayExpandInMeta = false,
  displayBlurData = false,
  displayDownload = false,
  displayDateTaken = false,
  openPermalinkInNewTab = false,
  isAuthenticated = false,
  isSelected: isSelectedProp = false,
  enabledEdit = false,
  noShowAnyMeta = false,
  noShowEditFeatures = false,
  noShowCaption = true,
  noShowTitle = true,
  ctaElement,
  enableSelecting = false,
  handleOnSelectAsset,
}: PreviewSingleUploadedAssetsProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  const pathname = usePathname();

  // https://www.framer.com/motion/use-reduced-motion/
  const prefersReducedMotion = useReducedMotion();

  const [isSelected, setIsSelected] = React.useState(isSelectedProp);
  // console.log(`**** isSelected and prop`, {
  //   isSelected,
  //   isSelectedProp,
  //   assetId: asset.id,
  // });

  const [isFullscreenMapDialogOpen, setIsFullscreenMapDialogOpen] =
    React.useState(false);
  const [viewDialogImgFull, setViewDialogImgFull] =
    React.useState<boolean>(false);

  const [isFlipped, setIsFlipped] = React.useState(false);

  const [showInfoScreen, setShowInfoScreen] = React.useState(false);
  const [showEditScreen, setShowEditScreen] = React.useState(false);

  const {
    id,
    user: assetAuthorProp,
    title,
    caption,
    locationName,
    price,
    usageNotes,
    public: publiclyVisibleProp,
    downloadable: downloadableProp,
    remixable: remixableProp,
    thumbnail,
    blurData,
    extension,
    urlOriginal,
    url,
    exif,
  } = asset;

  const {
    iso,
    make,
    model,
    takenAt,
    fNumber,
    takenAtNaive,
    focalLength35,
    aspectRatio,
    latitude,
    longitude,
  } = exif || {};

  const hasBasicExifData = iso || make || model || takenAt || fNumber;

  const mediaIsImage = extension
    ? isImageExtension(extension)
    : isImage(urlOriginal || url);

  const mediaIsVideo = extension
    ? isVideoExtension(extension)
    : isVideo(urlOriginal || url);

  const hasGeoData = latitude && longitude;

  const { staffPick } = asset;

  const showTitleOrCaption =
    (title && !noShowTitle) || (caption && !noShowCaption);

  const {
    path: thumbnailBase64,
    width: thumbnailWidth,
    height: thumbnailHeight,
  } = thumbnail || {};

  const hasThumbnail = thumbnailBase64 && thumbnailWidth && thumbnailHeight;

  const { avatar, image, name: authorName } = author || {};
  const authorAvatar = avatar || image || '';

  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    React.useState(false);

  // Handle selecting the asset
  const onHandleOnSelectAsset = () => {
    if (!enableSelecting) return;

    if (typeof handleOnSelectAsset === 'function') {
      handleOnSelectAsset(!isSelected, asset);
    }
    setIsSelected((prevState) => !prevState);
  };

  // Show the delete confirmation dialog
  const handleTogglingDeleteConfirmation = () => {
    setShowDeleteConfirmation((prevState) => !prevState);
  };

  // Handle the deletion of the media asset after confirmation
  const handleDeletionConfirmation = async () => {};

  const [remixable, setRemixable] = React.useState(remixableProp);

  const handleTogglingRemixable = async (nextState: boolean) => {
    // Optimistically update the UI
    setRemixable(nextState);
    toast.success(`Remixability set to ${nextState ? 'Enabled' : 'Disabled'}`);
    // Persist the change to the server (db)
    const updatedMedia = await updateMediaRemixable(id, nextState);
    if (updatedMedia && updatedMedia.remixable === nextState) {
      clearPathCache(pathname);
    } else {
      toast.error('Failed to update remixability');
      setRemixable(!nextState);
    }
  };

  const [downloadable, setDownloadable] = React.useState(downloadableProp);

  const handleTogglingDownloadable = async (nextState: boolean) => {
    // Optimistically update the UI
    setDownloadable(nextState);
    toast.success(
      `Downloadability set to ${nextState ? 'Enabled' : 'Disabled'}`
    );
    // Persist the change to the server (db)
    const updatedMedia = await updateMediaDownloadable(id, nextState);
    if (updatedMedia && updatedMedia.downloadable === nextState) {
      clearPathCache(pathname);
    } else {
      toast.error('Failed to update downloadability');
      setDownloadable(!nextState);
    }
  };

  const [publiclyVisible, setPubliclyVisible] =
    React.useState(publiclyVisibleProp);

  const handleTogglingVisibility = async (nextState: boolean) => {
    // Optimistically update the UI
    setPubliclyVisible(nextState);
    toast.success(`Visibility set to ${nextState ? 'Public' : 'Private'}`);
    // Persist the change to the server (db)
    const updatedMedia = await updateMediaPublicVisibility(id, nextState);
    if (updatedMedia && updatedMedia.public === nextState) {
      clearPathCache(pathname);
    } else {
      toast.error('Failed to update visibility');
      setPubliclyVisible(!nextState);
    }
  };

  const handleFlippingImage = () => {
    if (!hasGeoData) return;

    setIsFlipped((prevState) => !prevState);
  };

  const handleTogglingInfoScreen = () => {
    setShowInfoScreen((prevState) => !prevState);
  };

  const handleTogglingEditScreen = () => {
    setShowEditScreen((prevState) => !prevState);
  };

  return (
    <PreviewSingleAssetContainer className={className}>
      {showTitleOrCaption && (
        <div className="absolute left-0 right-0 top-0 z-20 flex flex-col items-start gap-2 px-4 py-6 sm:py-4">
          <Prose className="flex w-full flex-col gap-1 @container/asset-title prose-h3:my-0">
            {title && !noShowTitle && (
              <h3 className="truncate text-base font-medium drop-shadow @sm/asset-title:text-xl @lg/asset-title:text-2xl @xl/asset-title:text-2xl">
                {title}
              </h3>
            )}
            {caption && !noShowCaption && (
              <p className="text-foreground/80 drop-shadow-sm @xl/asset-title:text-lg">
                {caption}
              </p>
            )}
          </Prose>
        </div>
      )}
      {/* Front */}
      <motion.div
        animate={{ rotateY: isFlipped ? -180 : 0 }}
        transition={spring}
        className="absolute size-full rounded-md"
        style={{
          // width: '100%',
          // height: '100%',
          // position: 'absolute',
          zIndex: isFlipped ? 0 : 1,
          backfaceVisibility: 'hidden',
          perspective: '1200px',
          transformStyle: 'preserve-3d',
        }}
        onClick={
          enableSelecting
            ? (e) => {
                if (typeof onHandleOnSelectAsset === 'function') {
                  onHandleOnSelectAsset();
                }
                e.stopPropagation();
                e.preventDefault();
              }
            : undefined
        }
      >
        {mediaIsImage && (
          <Image
            fill
            placeholder={blurData ? 'blur' : undefined}
            blurDataURL={blurData ? blurData : undefined}
            src={displayBlurData && blurData ? blurData : asset.url}
            alt={caption || 'Uploaded NV Pic'}
            className={cn(
              'pointer-events-none size-full rounded-md object-cover',
              enableSelecting && 'rounded-lg border-4 border-transparent',
              {
                'border-tertiary': enableSelecting && isSelectedProp,
              }
            )}
            // imgClassName="object-cover h-full"
          />
        )}
        {mediaIsVideo && (
          <video
            loop
            muted
            controls
            // width={mediaIsPortrait ? videoPortraitWidth : videoLandscapeWidth}
            // height={mediaIsPortrait ? videoPortraitHeight : videoLandscapeHeight}
            // onCanPlay={(e) => {
            //   // console.log(`**** videoElement onCanPlay`, e);
            //   setIsMediaLoaded(true);
            //   determineVideoAspectRatioAndOrientation(e.currentTarget);
            // }}
            className={cn(
              'size-full rounded-md object-cover',
              enableSelecting && 'rounded-lg border-4 border-transparent',
              {
                'border-tertiary': enableSelecting && isSelectedProp,
              }
            )}
          >
            <source src={urlOriginal || url} type="video/mp4" />
            <source src={urlOriginal || url} type="video/webm" />
            <source src={urlOriginal || url} type="video/ogg" />
          </video>
        )}
        {!noShowAnyMeta && (id || hasBasicExifData) && (
          <PreviewSingleAssetExifData
            positionAbsolute
            noMakeName
            noModelName={!displayModelName}
            noShowEditFeatures={noShowEditFeatures}
            displayAuthorName={displayAuthorName}
            isStaffPick={staffPick}
            isAuthenticated={isAuthenticated}
            downloadable={downloadable}
            displayDownload={displayDownload}
            openPermalinkInNewTab={openPermalinkInNewTab}
            downloadUrl={asset.urlDownload || asset.urlOriginal || asset.url}
            publiclyVisible={publiclyVisible}
            remixable={remixable}
            enabledEdit={enabledEdit}
            // displayEdit={false}
            id={id}
            exif={exif}
            author={author || assetAuthorProp}
            usageNotes={usageNotes}
            thumbnail={thumbnail}
            ctaElement={ctaElement}
            handleEditingAsset={handleTogglingEditScreen}
            handleFlippingImage={handleFlippingImage}
            handleOpeningDialog={
              displayExpandInMeta
                ? () => setIsFullscreenMapDialogOpen(true)
                : undefined
            }
            handleTogglingVisibility={handleTogglingVisibility}
            handleTogglingDownloadable={handleTogglingDownloadable}
            handleTogglingRemixability={handleTogglingRemixable}
            handleTogglingInfoScreen={handleTogglingInfoScreen}
          />
        )}
      </motion.div>
      {/* Back */}
      {hasGeoData && (
        <motion.div
          initial={{ rotateY: 180 }}
          animate={{ rotateY: isFlipped ? 0 : 180 }}
          transition={spring}
          className="absolute size-full rounded-md"
          style={{
            minWidth: 200,
            zIndex: isFlipped ? 1 : 0,
            backfaceVisibility: 'hidden',
            perspective: '1200px',
            transformStyle: 'preserve-3d',
          }}
        >
          <ExperienceMapClient
            noRenderList
            className="min-h-full rounded-md"
            mapContent={
              !isAuthenticated ? <LoginToViewPhotoMapScreen /> : undefined
            }
            destinations={[
              {
                placeId: 'fake-place-id',
                icon:
                  isAuthenticated && hasThumbnail
                    ? {
                        path: thumbnailBase64,
                        width: thumbnailWidth,
                        height: thumbnailHeight,
                      }
                    : undefined,
                coordinates: isAuthenticated
                  ? { latitude: latitude!, longitude: longitude! }
                  : {
                      // Nevada coordinates
                      latitude: 39.5501,
                      longitude: -116.7517,
                    },
              },
            ]}
          />
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFlippingImage();
            }}
            className="absolute bottom-1 left-1 right-1 gap-1 p-1 text-xs font-medium leading-none"
          >
            <span>Flip to Image</span> <IconImage className="size-3.5" />
          </Button>
        </motion.div>
      )}
      {!isFlipped && !displayBlurData && (
        <Button
          size="custom"
          variant="ghost"
          className="absolute right-1 top-1 z-50 p-1.5"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFullscreenMapDialogOpen(true);
          }}
        >
          <IconExpand className="size-3" />
        </Button>
      )}
      {/* Single Photo Dialog (Modal) */}
      {isFullscreenMapDialogOpen && (
        <GeneralDrawer
          dontScaleBackground
          open={isFullscreenMapDialogOpen}
          footerCtaLabel="Back"
          title={
            dialogTitle
              ? dialogTitle
              : title
                ? title
                : 'Uploaded NV Pic (Untitled)'
          }
          titleContent={
            id && enabledEdit ? (
              <EditAssetBtn
                id={id}
                handleOnEditAsset={handleTogglingEditScreen}
              />
            ) : undefined
          }
          handleOnClose={() => setIsFullscreenMapDialogOpen(false)}
        >
          <div className="relative flex size-full max-w-full grow flex-col">
            <div className="relative mx-auto grid size-full max-w-full grow grid-cols-6 items-center justify-center overflow-clip rounded-lg sm:max-w-full">
              <div
                className={cn('relative col-span-3 size-full', {
                  'col-span-6': !hasGeoData,
                  'col-span-3': hasGeoData,
                  'col-span-5': hasGeoData && viewDialogImgFull,
                })}
              >
                {mediaIsImage && (
                  <Image
                    fill
                    // blurCompatibilityMode
                    // aspectRatio={aspectRatio!}
                    placeholder={blurData ? 'blur' : undefined}
                    blurDataURL={blurData ? blurData : undefined}
                    src={asset.url}
                    alt={caption || 'Uploaded NV Pic'}
                    className={cn('my-0 h-full min-h-full object-cover', {
                      'object-contain md:object-cover': !viewDialogImgFull,
                      'object-contain': viewDialogImgFull,
                    })}
                  />
                )}

                {mediaIsVideo && (
                  <video
                    loop
                    muted
                    controls
                    autoPlay
                    className={cn('my-0 h-full min-h-full object-cover', {
                      'object-contain md:object-cover': !viewDialogImgFull,
                      'object-contain': viewDialogImgFull,
                    })}
                  >
                    <source src={urlOriginal || url} type="video/mp4" />
                    <source src={urlOriginal || url} type="video/webm" />
                    <source src={urlOriginal || url} type="video/ogg" />
                  </video>
                )}

                <Button
                  variant="outline"
                  size="custom"
                  className="absolute right-1 top-1 z-50 hidden p-2 md:block"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setViewDialogImgFull((s) => !s);
                  }}
                >
                  <IconExpandRightArrow
                    className={cn('size-4', {
                      'rotate-180': viewDialogImgFull,
                    })}
                  />
                </Button>
              </div>

              {hasGeoData && (
                <ExperienceMapClient
                  noRenderList
                  mapContent={
                    !isAuthenticated ? <LoginToViewPhotoMapScreen /> : undefined
                  }
                  className={cn('h-full')}
                  containerClassName={cn('col-span-3', {
                    'col-span-1': viewDialogImgFull,
                  })}
                  destinations={[
                    {
                      placeId: 'fake-place-id',
                      icon:
                        isAuthenticated && hasThumbnail
                          ? {
                              path: thumbnailBase64,
                              width: thumbnailWidth,
                              height: thumbnailHeight,
                            }
                          : undefined,
                      coordinates: isAuthenticated
                        ? {
                            latitude: latitude!,
                            longitude: longitude!,
                          }
                        : {
                            // Nevada coordinates
                            latitude: 39.5501,
                            longitude: -116.7517,
                          },
                    },
                  ]}
                />
              )}
            </div>
            {(id || hasBasicExifData) && (
              <div className="bg-foreground/5">
                <PreviewSingleAssetExifData
                  noMapIcon
                  positionAbsolute
                  isStaffPick={staffPick}
                  enabledEdit={enabledEdit}
                  noShowEditFeatures={noShowEditFeatures}
                  openPermalinkInNewTab={openPermalinkInNewTab}
                  displayDownload={displayDownload}
                  publiclyVisible={publiclyVisible}
                  downloadable={downloadable}
                  remixable={remixable}
                  // noModelName
                  id={id}
                  exif={exif}
                  thumbnail={thumbnail}
                  className="bottom-0"
                  headingClassName="p-1.5"
                  handleTogglingVisibility={handleTogglingVisibility}
                  handleTogglingDownloadable={handleTogglingDownloadable}
                  handleTogglingRemixability={handleTogglingRemixable}
                  handleEditingAsset={handleTogglingEditScreen}
                  // handleFlippingImage={handleFlippingImage}
                />
              </div>
            )}
          </div>
        </GeneralDrawer>
      )}
      {/* Edit Info Dialog */}
      {showEditScreen && (
        <EditSingleAssetInfoDialog
          open={showEditScreen}
          handleOnClose={handleTogglingEditScreen}
        >
          <MediaUpdateForm
            id={id}
            title={title}
            caption={caption}
            location={locationName}
            price={price}
            usageNotes={usageNotes}
            publiclyVisible={publiclyVisible}
            downloadable={downloadable}
            remixable={remixable}
            titleLabelClassName=""
            captionLabelClassName=""
            containerClassName=""
            formFieldsClassName=""
            captionInputClassName="resize-none min-h-[initial] h-14"
            usageRightsInputClassName="resize-none min-h-[initial] h-14"
            submitBtnClassName="w-full sm:w-auto"
            handleAsyncDownloadableToggle={handleTogglingDownloadable}
            handleAsyncPubliclyVisibleToggle={handleTogglingVisibility}
            handleAsyncRemixableToggle={handleTogglingRemixable}
          />
        </EditSingleAssetInfoDialog>
      )}
      {/* Read-only Info Dialog */}
      {showInfoScreen && (
        <PreviewSingleAssetInfoDialog
          open={showInfoScreen}
          isStaffPick={staffPick}
          handleOnClose={handleTogglingInfoScreen}
          handleOnEditAsset={
            enabledEdit
              ? () => {
                  // handleTogglingInfoScreen();
                  handleTogglingEditScreen();
                }
              : undefined
          }
          footerClassName={
            enabledEdit ? 'justify-between flex-row sm:justify-between' : ''
          }
        >
          <div className="relative h-72 grow sm:h-52">
            {mediaIsImage && (
              <ImageMedium
                fill
                blurCompatibilityMode
                blurDataURL={blurData}
                aspectRatio={aspectRatio!}
                src={displayBlurData && blurData ? blurData : asset.url}
                alt={caption || 'Uploaded NV Pic'}
                className="pointer-events-none size-full rounded-md"
                imgClassName="object-cover"
              />
            )}

            {mediaIsVideo && (
              <video
                loop
                muted
                controls
                autoPlay
                className="pointer-events-none size-full rounded-md object-cover"
              >
                <source src={urlOriginal || url} type="video/mp4" />
                <source src={urlOriginal || url} type="video/webm" />
                <source src={urlOriginal || url} type="video/ogg" />
              </video>
            )}
          </div>
          <Prose className="prose-sm max-w-none p-4 prose-hr:my-8">
            <h4>{title || 'Untitled'}</h4>
            <p
              className={cn({
                'opacity-70': !caption,
              })}
            >
              {caption || 'No Caption'}
            </p>
            <p
              className={cn({
                'opacity-70': !locationName,
              })}
            >
              {locationName || 'Location Unspecified'}
            </p>
            <hr />
            <div className="flex flex-col gap-2 text-foreground/80 md:gap-1.5">
              {authorName && (
                <div className="flex items-center justify-between font-medium">
                  <h5 className="font-bold">Author/Owner</h5>
                  <div className="flex flex-row items-center gap-1.5">
                    <p className="my-0">{authorName}</p>
                    {author?.public && authorAvatar && (
                      <div className="relative size-6">
                        <UserAvatar
                          src={authorAvatar}
                          alt={`${authorName} profile image`}
                          containerClassName="size-6"
                          className="my-0 border-2"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {author?.url && (
                <div className="flex items-center justify-between font-medium">
                  <h5 className="font-bold">Website/Social</h5>
                  <p className="my-0">
                    <a
                      href={makeUrlAbsolute(author.url)}
                      className={cn(
                        buttonVariants({
                          variant: 'link',
                          size: 'off',
                        }),
                        { 'text-[inherit]': true }
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {shortenUrl(author.url)}
                    </a>
                  </p>
                </div>
              )}

              {author?.urlSocial && (
                <div className="flex items-center justify-between font-medium">
                  <h5 className="font-bold">Social</h5>
                  <p className="my-0">
                    <a
                      href={makeUrlAbsolute(author.urlSocial)}
                      className={cn(
                        buttonVariants({
                          variant: 'link',
                          size: 'off',
                        }),
                        { 'text-[inherit]': true }
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {shortenUrl(author.urlSocial)}
                    </a>
                  </p>
                </div>
              )}

              {(takenAt || takenAtNaive) && displayDateTaken && (
                <div className="flex items-center justify-between font-medium">
                  <h5 className="font-bold">Date Captured</h5>
                  <p className="my-0">
                    {formatDateLegacy(new Date(takenAtNaive || takenAt))}
                  </p>
                </div>
              )}

              {/* Geolocation */}
              {hasGeoData && (
                <div className="flex items-center justify-between font-medium">
                  <h5 className="font-bold">Latitude/Longitude</h5>
                  <p className="my-0 flex flex-row gap-2">
                    <CopyText
                      text={`${latitude}, ${longitude}`}
                      copiedTextLabel="Media Lat/Long copied to clipboard"
                    >
                      {Number.parseFloat(String(latitude)).toFixed(3)},{' '}
                      {Number.parseFloat(String(longitude)).toFixed(3)}
                    </CopyText>
                    <Button
                      variant="link"
                      size="off"
                      onClick={() => setIsFullscreenMapDialogOpen(true)}
                    >
                      (Map)
                    </Button>
                  </p>
                </div>
              )}

              {/* Remixable Content */}
              {typeof remixable !== 'undefined' && (
                <div className="flex items-center justify-between font-medium">
                  <h5 className="font-bold">Remixable</h5>
                  <p className="my-0">
                    <BaseTooltip
                      content={
                        <BaseTooltipContent
                          title={`Remixable (${remixable ? 'Enabled' : 'Disabled'})`}
                          content="When enabled, users can combine content within the platform for marketing, promotion and fun purposes."
                        />
                      }
                    >
                      <span className="flex items-center gap-1.5">
                        {remixable ? 'Yes' : 'No'}
                        <IconInfo />
                      </span>
                    </BaseTooltip>
                  </p>
                </div>
              )}

              {/* Downloadable Content */}
              {typeof downloadable !== 'undefined' && (
                <div className="flex items-center justify-between font-medium">
                  <h5 className="font-bold">Downloadable</h5>
                  <p className="my-0 text-right">
                    <BaseTooltip
                      content={
                        <BaseTooltipContent
                          title={`Downloadable (${downloadable ? 'Enabled' : 'Disabled'})`}
                          content="When enabled, users can download content for use based on the author's licensing terms."
                        />
                      }
                    >
                      <span className="flex items-center gap-1.5">
                        {downloadable ? 'Yes' : 'No'}
                        <IconInfo className="" />
                      </span>
                    </BaseTooltip>
                  </p>
                </div>
              )}

              {/* Shareability */}
              {typeof publiclyVisible !== 'undefined' && (
                <div className="flex items-center justify-between font-medium">
                  <h5 className="font-bold">Shareable Link</h5>
                  {!publiclyVisible && 'Private'}
                  {publiclyVisible && id && (
                    <p className="my-0 flex items-center gap-1.5">
                      <CopyText
                        text={`${new URL(window.location.href).host}/featured/photo/${id}`}
                        copiedTextLabel="Media shareable link copied to clipboard"
                      >
                        Copy <IconHorizontalLink />
                      </CopyText>
                    </p>
                  )}
                </div>
              )}

              {typeof price !== 'undefined' &&
                price !== null &&
                Number(price) !== 0 && (
                  <div className="flex items-center justify-between font-medium">
                    <h5 className="font-bold">Non-Platform License Price</h5>
                    <p className="my-0 flex items-center gap-1.5">
                      {/* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat */}
                      {new Intl.NumberFormat('en-US', {
                        // currencyDisplay: 'narrowSymbol',
                        // currencySign: 'accounting',
                        style: 'currency',
                        currency: 'USD',
                      }).format(Number.parseFloat(price))}
                      <BaseTooltip
                        content={
                          <BaseTooltipContent
                            title={`Non-Platform License Price`}
                            content="Media content is subject to the author's licensing terms. At a minimum, unless otherwise specified by the author, you must provide attribution to the author if you download the media content for usage in your projects."
                          />
                        }
                      >
                        <span className="flex items-center gap-1.5">
                          <IconInfo className="" />
                        </span>
                      </BaseTooltip>
                    </p>
                  </div>
                )}

              {/* Usage Notes/License Rights by Author */}
              <div
                className="flex flex-col items-start justify-between gap-1 font-medium"
                id="usage-notes"
              >
                <h5 className="flex w-full gap-1.5 font-bold">
                  <span>Purchase Usage/License Rights</span>
                  <BaseTooltip
                    content={
                      <BaseTooltipContent
                        title={`Usage/License Rights`}
                        content="Media content is subject to the author's licensing terms. At a minimum, you must provide attribution to the author if you donwload the media content for usage in your projects."
                      />
                    }
                  >
                    <span className="flex items-center gap-1.5">
                      <IconInfo className="" />
                    </span>
                  </BaseTooltip>
                </h5>
                <p className="my-0">{usageNotes ? usageNotes : ``}</p>
                {usageNotes && price && Number(price) !== 0 && (
                  <p className="my-0">
                    Contact the author using their specified website/contact
                    info to arrange payment.
                  </p>
                )}
              </div>
            </div>
          </Prose>
        </PreviewSingleAssetInfoDialog>
      )}
    </PreviewSingleAssetContainer>
  );
}

export interface UploadedAssetsProps {
  author?: PhotoAuthor | null;
  enabledEdit?: boolean;
  noShowEditFeatures?: boolean;
  showAssetTitle?: boolean;
  isAuthenticated?: boolean;
  displayDownload?: boolean;
  assets: PhotoBasicExifData[];
  noUseDefaultColumns?: boolean;
  openPermalinkInNewTab?: boolean;
  className?: string;
  assetClassName?: string;
  enableAssetSelecting?: boolean;
  selectedMediaIds?: string[];
  handleOnSelectAsset?: PreviewSingleUploadedAssetsProps['handleOnSelectAsset'];
}

export function PreviewUploadedAssets({
  author,
  assets,
  className,
  assetClassName,
  openPermalinkInNewTab = true,
  noShowEditFeatures = false,
  noUseDefaultColumns = false,
  displayDownload = false,
  showAssetTitle = true,
  isAuthenticated = false,
  enabledEdit = false,
  enableAssetSelecting = false,
  selectedMediaIds = [],
  handleOnSelectAsset,
}: UploadedAssetsProps) {
  const selectedMediaCount = selectedMediaIds.length;
  const hasSelectedMedia = Boolean(selectedMediaCount);

  return (
    <PreviewUploadedAssetsContainer
      noUseDefaultColumns={noUseDefaultColumns}
      className={className}
    >
      {assets.map((asset, assetIndex) => {
        const isSelected = selectedMediaIds.includes(asset.id);

        const selectable = Boolean(
          (enableAssetSelecting && handleOnSelectAsset) ||
            (!enableAssetSelecting &&
              handleOnSelectAsset &&
              selectedMediaIds.includes(asset.id))
        );

        const selectionDisabled =
          hasSelectedMedia && !enableAssetSelecting && !isSelected;

        return (
          <PreviewSingleUploadedAssets
            key={`single-uploaded-asset-${asset.url}-${assetIndex}-${selectable}`}
            asset={asset}
            author={author}
            className={cn(assetClassName, {
              'opacity-40': selectionDisabled,
              'cursor-pointer': selectable,
            })}
            isAuthenticated={isAuthenticated}
            displayDownload={displayDownload}
            openPermalinkInNewTab={openPermalinkInNewTab}
            noShowEditFeatures={noShowEditFeatures}
            noShowTitle={!showAssetTitle}
            enabledEdit={enabledEdit}
            enableSelecting={selectable}
            isSelected={selectedMediaIds.includes(asset.id)}
            handleOnSelectAsset={handleOnSelectAsset}
          />
        );
      })}
    </PreviewUploadedAssetsContainer>
  );
}

export interface PreviewUserUploadedAssetsDialogProps {
  author?: PhotoAuthor | null;
  assets: PhotoBasicExifData[];
  className?: string;
  open?: boolean;
  enableEdit?: boolean;
  isAuthenticated?: boolean;
  handleOnClose?: () => void;
}

export function PreviewUserUploadedAssetsDialog({
  author,
  open = false,
  enableEdit = false,
  isAuthenticated = false,
  assets,
  className,
  handleOnClose,
}: PreviewUserUploadedAssetsDialogProps) {
  // console.log(`**** assets in PreviewUserUploadedAssets`, assets);
  const [isOpen, setIsOpen] = React.useState(open);

  if (!assets || !assets.length) {
    return null;
  }

  const handleOnOpenChange = (nextState: boolean) => {
    setIsOpen(nextState);
    if (typeof handleOnClose === 'function') {
      handleOnClose();
    }
  };

  const handleOnCloseAction = (e: React.MouseEvent<Element, MouseEvent>) => {
    e.preventDefault();
    setIsOpen(false);
    if (typeof handleOnClose === 'function') {
      handleOnClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOnOpenChange}>
      <DialogContent
        className={cn('max-w-6xl', className)}
        overlayProps={{
          className: cn('backdrop-blur-sm bg-background/50'),
        }}
      >
        <DialogHeader>
          <DialogTitle>Your Uploaded NV Media</DialogTitle>
          <DialogDescription>
            Here&apos;s what you uploaded to the platform so far.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[72lvh] min-h-[20lvh] space-y-1 overflow-auto rounded-md border p-4 lg:max-h-[76lvh]">
          <PreviewUploadedAssets
            enabledEdit={enableEdit}
            isAuthenticated={isAuthenticated}
            assets={assets}
            author={author}
          />
        </div>
        <DialogFooter className="items-center justify-around">
          <Button className="flex gap-1.5" onClick={handleOnCloseAction}>
            Cool!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
