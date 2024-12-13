'use client';

import React, { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { IconSpinner } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ButtonCta } from '@/components/cta-btn';
import { SharedInfoTooltip } from '@/components/tooltip';

import { saveMediaAttrChanges } from './media-update-actions';
import { getMediaMessageFromCode } from './media-update-utils';

export type MediaUpdateFormProps = {
  id: string;
  title?: string;
  caption?: string;
  location?: string;
  usageNotes?: string;
  price?: number | string;
  downloadable?: boolean;
  publiclyVisible?: boolean;
  remixable?: boolean;
  formTitle?: string;
  className?: string;
  containerClassName?: string;
  formFieldsClassName?: string;
  captionLabelClassName?: string;
  usageRightsInputClassName?: string;
  titleLabelClassName?: string;
  locationLabelClassName?: string;
  submitBtnClassName?: string;
  titleInputClassName?: string;
  captionInputClassName?: string;
  locationInputClassName?: string;
  priceInputClassName?: string;
  remixableInputClassName?: string;
  downloadableInputClassName?: string;
  publiclyVisibleInputClassName?: string;
  redirectPath?: string;
  handleAsyncRemixableToggle?: (state: boolean) => void;
  handleAsyncPubliclyVisibleToggle?: (state: boolean) => void;
  handleAsyncDownloadableToggle?: (state: boolean) => void;
};

export function MediaUpdateForm({
  id,
  title: titleProp = '',
  caption: captionProp = '',
  location: locationProp = '',
  price: priceProp = undefined,
  usageNotes: usageRightsProp = '',
  downloadable: downloadableProp = false,
  publiclyVisible: publiclyVisibleProp = false,
  remixable: remixableProp = false,
  formTitle,
  redirectPath,
  className,
  containerClassName,
  formFieldsClassName,
  captionLabelClassName,
  titleLabelClassName,
  locationLabelClassName,
  submitBtnClassName,
  titleInputClassName,
  captionInputClassName,
  locationInputClassName,
  usageRightsInputClassName,
  priceInputClassName,
  remixableInputClassName,
  downloadableInputClassName,
  publiclyVisibleInputClassName,
  handleAsyncRemixableToggle,
  handleAsyncPubliclyVisibleToggle,
  handleAsyncDownloadableToggle,
}: MediaUpdateFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  // Form state
  const [inputTitle, setInputTitle] = React.useState(titleProp);
  const [inputCaption, setInputCaption] = React.useState(captionProp);
  const [inputLocation, setInputLocation] = React.useState(locationProp);
  const [inputPrice, setInputPrice] = React.useState<number | undefined>(
    priceProp
      ? typeof priceProp === 'number'
        ? Number.parseFloat(priceProp?.toFixed(2))
        : Number.parseFloat(priceProp)
      : undefined
  );

  const [inputUsageRights, setInputUsageRights] =
    React.useState(usageRightsProp);
  const [inputDownloadable, setInputDownloadable] =
    React.useState(downloadableProp);
  const [inputPubliclyVisible, setInputPubliclyVisible] =
    React.useState(publiclyVisibleProp);
  const [inputRemixable, setInputRemixable] = React.useState(remixableProp);

  // Form submission action
  const { pending } = useFormStatus();
  const [result, dispatch] = useActionState(saveMediaAttrChanges, undefined);
  // console.log(`**** result`, result);

  const areThereChanges =
    inputTitle !== titleProp ||
    inputCaption !== captionProp ||
    inputLocation !== locationProp ||
    inputPrice !== priceProp ||
    inputUsageRights !== usageRightsProp ||
    inputDownloadable !== downloadableProp ||
    inputPubliclyVisible !== publiclyVisibleProp ||
    inputRemixable !== remixableProp;

  // Handle onEnter key press for textareas (shift + enter to submit)
  const handleTextAreaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (formRef.current) {
      const value = e.currentTarget.value;
      if (e.key === 'Enter' && e.shiftKey) {
        e.currentTarget.value = `${value}`;
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.currentTarget.value = value.trim();
        // e.stopPropagation();
        // e.preventDefault();
        // Uncomment this line to submit the form on enter key press
        // formRef.current.requestSubmit();
      }
    }
  };

  // Handle onEnter key press for general text inputs
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (formRef.current) {
      if (e.key === 'Enter') {
        e.stopPropagation();
        formRef.current.requestSubmit();
      }
    }
  };

  const handleRemixableToggle = (state: boolean) => {
    setInputRemixable(state);
    if (typeof handleAsyncRemixableToggle === 'function') {
      handleAsyncRemixableToggle(state);
    }
  };

  const handleDownloadableToggle = (state: boolean) => {
    setInputDownloadable(state);
    if (typeof handleAsyncDownloadableToggle === 'function') {
      handleAsyncDownloadableToggle(state);
    }
  };

  const handlePubliclyVisibleToggle = (state: boolean) => {
    setInputPubliclyVisible(state);
    if (typeof handleAsyncPubliclyVisibleToggle === 'function') {
      handleAsyncPubliclyVisibleToggle(state);
    }
  };

  useEffect(() => {
    if (result) {
      if (result.type === 'error') {
        toast.error(getMediaMessageFromCode(result.resultCode));
      } else {
        toast.success(getMediaMessageFromCode(result.resultCode));
        if (redirectPath) {
          router.push(redirectPath);
        }
        router.refresh();
      }
    }
  }, [result, redirectPath, router]);

  return (
    <form
      ref={formRef}
      action={dispatch}
      className={cn('flex flex-col items-center gap-4', className)}
    >
      <div className={cn('flex w-full flex-col gap-3', containerClassName)}>
        {formTitle && (
          <h3 className="hidden text-center text-base font-semibold text-foreground/80">
            {formTitle}
          </h3>
        )}
        <div
          className={cn(
            'flex w-full flex-col gap-4 rounded-lg shadow-md',
            formFieldsClassName
          )}
        >
          <div className="flex grow flex-col gap-2">
            <Label
              className={cn('font-medium', titleLabelClassName)}
              htmlFor="title"
            >
              Title
            </Label>
            <div className="relative">
              <Input
                id="title"
                name="title"
                type="text"
                value={inputTitle}
                placeholder="Untitled Media..."
                className={cn('', titleInputClassName)}
                onKeyDown={handleInputKeyDown}
                onChange={(e) => setInputTitle(e.target.value)}
                maxLength={64}
                required={false}
              />
            </div>
          </div>

          <div className="flex grow flex-col gap-2">
            <Label
              className={cn('font-medium', captionLabelClassName)}
              htmlFor="caption"
            >
              Caption
            </Label>
            <div className="relative">
              <Textarea
                id="caption"
                name="caption"
                placeholder="Caption"
                value={inputCaption}
                className={cn('', captionInputClassName)}
                onChange={(e) => {
                  const value = e.target.value;
                  setInputCaption(value);
                }}
                onKeyDown={handleTextAreaKeyDown}
                minLength={6}
                maxLength={140}
                required={false}
              />
            </div>
          </div>

          <div className="flex grow flex-col gap-2">
            <Label
              className={cn('font-medium', locationLabelClassName)}
              htmlFor="locationName"
            >
              Location Name
            </Label>
            <div className="relative">
              <Input
                id="locationName"
                name="locationName"
                type="text"
                value={inputLocation}
                placeholder="Name of Location"
                className={cn('', locationInputClassName)}
                onKeyDown={handleInputKeyDown}
                onChange={(e) => setInputLocation(e.target.value)}
                maxLength={64}
                required={false}
              />
            </div>
          </div>

          <div className="flex grow flex-col gap-2">
            <Label
              className={cn(
                'flex items-center gap-1.5 font-medium',
                captionLabelClassName
              )}
              htmlFor="price"
            >
              <span>License Price</span>
              <SharedInfoTooltip
                title={`License Price`}
                content="Set an optional price for commercial use of your media. At a minimum, users are required to credit you for your work."
              />
            </Label>
            <div className="relative">
              <Input
                id="price"
                name="price"
                type="number"
                value={inputPrice}
                placeholder="Price of Media (optional)"
                className={cn('', priceInputClassName)}
                onKeyDown={handleInputKeyDown}
                onChange={(e) => {
                  let value = e.target.value;
                  if (Number(value) < 0) {
                    value = '';
                    e.target.value = '';
                  }
                  const fixedValue = value
                    ? Number.parseFloat(value).toFixed(2)
                    : '';

                  setInputPrice(
                    fixedValue ? Number.parseFloat(fixedValue) : undefined
                  );
                }}
                required={false}
              />
            </div>
          </div>

          <div className="flex grow flex-col gap-2">
            <Label
              className={cn(
                'flex items-center gap-1.5 font-medium',
                captionLabelClassName
              )}
              htmlFor="usageNotes"
            >
              <span>Usage/License Rights</span>
              <SharedInfoTooltip
                title={`Usage/License Rights`}
                content="Do you have any usage notes or rights for this media, including price for commercial use? At a minimum, users are required to credit you for your work."
              />
            </Label>
            <div className="relative">
              <Textarea
                id="usageNotes"
                name="usageNotes"
                placeholder="Do you have any usage notes or rights for this media, including price for commercial use?"
                value={inputUsageRights}
                className={cn('', usageRightsInputClassName)}
                onChange={(e) => {
                  const value = e.target.value;
                  setInputUsageRights(value);
                }}
                onKeyDown={handleTextAreaKeyDown}
                minLength={6}
                maxLength={225}
                required={false}
              />
            </div>
          </div>

          <div className="flex grow flex-row justify-between gap-2">
            <Label
              className={cn('font-medium', captionLabelClassName)}
              htmlFor="remixable"
            >
              Remixable
            </Label>
            <div className="relative flex gap-1.5">
              <Switch
                id="remixable"
                name="remixable"
                className={cn('', remixableInputClassName)}
                thumbClassName=""
                value={inputRemixable ? 1 : 0}
                checked={inputRemixable}
                disabled={pending}
                onCheckedChange={(state) => {
                  handleRemixableToggle(state);
                }}
              />
              <SharedInfoTooltip
                title={`Remixable (${remixableProp ? 'Enabled' : 'Disabled'})`}
                content="When enabled, users can combine your content within the platform for collaborative marketing, promotion and fun purposes."
              />
            </div>
          </div>

          <div className="flex grow flex-row justify-between gap-2">
            <Label
              className={cn('font-medium', captionLabelClassName)}
              htmlFor="downloadable"
            >
              Downloadable
            </Label>
            <div className="relative flex gap-1.5">
              <Switch
                id="downloadable"
                name="downloadable"
                className={cn('', downloadableInputClassName)}
                thumbClassName=""
                value={inputDownloadable ? 1 : 0}
                checked={inputDownloadable}
                disabled={pending}
                onCheckedChange={(state) => {
                  handleDownloadableToggle(state);
                }}
              />
              <SharedInfoTooltip
                title={`Downloadable (${downloadableProp ? 'Enabled' : 'Disabled'})`}
                content="When enabled, users can download your content for use based on your licensing terms."
              />
            </div>
          </div>

          <div className="flex grow flex-row justify-between gap-2">
            <Label
              className={cn('font-medium', captionLabelClassName)}
              htmlFor="public"
            >
              Publicly Visible
            </Label>
            <div className="relative flex gap-1.5">
              <Switch
                id="public"
                name="public"
                className={cn('', publiclyVisibleInputClassName)}
                thumbClassName=""
                value={inputPubliclyVisible ? 1 : 0}
                checked={inputPubliclyVisible}
                disabled={pending}
                onCheckedChange={(state) => {
                  handlePubliclyVisibleToggle(state);
                }}
              />
              <SharedInfoTooltip
                title={`Publicly Visible (${publiclyVisibleProp ? 'Enabled' : 'Disabled'})`}
                content="When enabled, users can view your media content on the platform in various contexts."
              />
            </div>
          </div>

          {/* Media ID */}
          <input type="hidden" name="id" value={id} />
        </div>
        <SubmitButton
          disabled={!areThereChanges || pending}
          className={submitBtnClassName}
        />
      </div>
    </form>
  );
}

function SubmitButton({
  className,
  disabled = false,
}: {
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <ButtonCta
      aria-disabled={pending}
      disabled={pending || disabled}
      size="sm"
      className={cn('', className)}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {pending ? (
        <>
          <IconSpinner />
          <span>Going to space and back...</span>
        </>
      ) : (
        'Save'
      )}
    </ButtonCta>
  );
}
