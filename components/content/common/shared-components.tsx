import Link from 'next/link';

import { fileTypeToExtension } from '@/lib/media/media-utils';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AnimatedSuccessCheck } from '@/components/animations/animated-success-check';

import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { Button, buttonVariants } from '../../ui/button';
import {
  IconCircleHelp,
  IconCircleX,
  IconClose,
  IconFileImage,
  IconFileSearch,
  IconFileUpload,
  IconFileVolume,
  IconHtml2,
  IconMessageCircleCode,
  IconSpreadsheetFile,
  IconTextFile,
  IconVideo2,
} from '../../ui/icons';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import type {
  ParsedFileStatus,
  ParsedUrlStatus,
} from '../files/file-uploader-types';

export function createFilesListHash(
  files: FileList | File[] | null | undefined
) {
  if (!files) return;

  return Array.from(files)
    .map((file) => {
      return file.name;
    })
    .sort()
    .join('');
}

/**
 * Map a file type to an icon
 *
 * @param type - e.g. 'image/jpeg'
 * @param className - Additional classes to apply to the icon
 *
 * @returns React.ReactNode | null
 */
export function mapFileTypeToIcon(
  type: string,
  className?: string
): React.ReactNode | null {
  const baseClassName = 'size-6';
  const fileType = fileTypeToExtension(type);

  switch (fileType) {
    case 'pdf':
    case 'doc':
    case 'docx':
    case 'ppt':
    case 'pptx':
    case 'txt':
    case 'plain':
    case 'md':
    case 'x-markdown':
      return <IconTextFile className={cn(baseClassName, className)} />;
    case 'xlsx':
    case 'xls':
    case 'csv':
      return <IconSpreadsheetFile className={cn(baseClassName, className)} />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <IconFileImage className={cn(baseClassName, className)} />;
    case 'htm':
    case 'html':
      return <IconHtml2 className={cn(baseClassName, className)} />;
    case 'x-m4a':
    case 'mpeg':
      return <IconFileVolume className={cn(baseClassName, className)} />;
    default:
      return null;
  }
}

/**
 * Map a URL's type (by path) to an icon
 *
 * @param url - e.g. 'https://example.com/file.pdf' or 'index.html', etc.
 * @param className - Additional classes to apply to the icon
 *
 * @returns React.ReactNode | null
 */
export function mapUrlTypeToIcon(
  url: string,
  className?: string,
  baseClassName = 'size-6'
): React.ReactNode | null {
  // Get the URL host and pathname and parts
  const urlInstance = new URL(url);
  const urlHost = urlInstance.host;

  const urlPathname = urlInstance.pathname;
  const urlParts = urlPathname.split('.').pop();
  // Type reflects a potential file extension
  const urlType = urlParts?.length === 2 ? urlParts[1] : '';

  // Now, let's map the URL type to an icon
  let icon = null;

  if (urlType) {
    const textTypeList = ['pdf', 'docx'];
    const spreadsheetTypeList = ['csv'];
    const imageTypeList = ['png', 'jpg', 'jpeg', 'gif'];
    const audioTypeList = ['mpeg', 'm4a'];

    if (textTypeList.includes(urlType)) {
      icon = <IconTextFile className={cn(baseClassName, className)} />;
      // Spreadsheet
    } else if (spreadsheetTypeList.includes(urlType)) {
      icon = <IconSpreadsheetFile className={cn(baseClassName, className)} />;
      // Image
    } else if (imageTypeList.includes(urlType)) {
      icon = <IconFileImage className={cn(baseClassName, className)} />;
      // Audio
    } else if (audioTypeList.includes(urlType)) {
      icon = <IconFileVolume className={cn(baseClassName, className)} />;
      // HTML
    } else {
      icon = <IconHtml2 className={cn(baseClassName, className)} />;
    }
  } else {
    const youtubeTypeList = ['youtube', 'youtu.be'];
    if (youtubeTypeList.includes(urlHost)) {
      icon = <IconVideo2 className={cn(baseClassName, className)} />;
    } else {
      icon = <IconHtml2 className={cn(baseClassName, className)} />;
    }
  }

  return icon;
}

/**
 * Map a parsed file's or URL's status to an icon
 *
 * @param status - The status of the parsed file, @see ParsedFileStatus
 */
export function mapParsedFileOrUrlStatusToIcon(
  status: ParsedFileStatus | ParsedUrlStatus,
  className?: string
): React.ReactNode {
  const baseClassName = 'size-4';
  switch (status) {
    case 'success':
      return <IconTextFile className={cn(baseClassName, className)} />;
    case 'error':
      return <IconCircleX className={cn(baseClassName, className)} />;
    default:
      return null;
  }
}

/**
 * General Label/Text with Tooltip
 */
export function WithTooltip({
  tooltip,
  children,
  className,
  triggerClassName,
}: {
  tooltip: string;
  className?: string;
  triggerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={325}>
      <Tooltip>
        <TooltipTrigger
          onClick={(e) => {
            // Do this, otherwise, can submit the form if inside a form
            e.preventDefault();
            e.stopPropagation();
          }}
          className={triggerClassName}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent sideOffset={8} className={cn('max-w-56', className)}>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export interface ParsedFileOrUrlListingStatusIconProps {
  status: ParsedFileStatus;
  className?: string;
}

export function ParsedFileOrUrlListingStatusIcon({
  status,
  className,
}: ParsedFileOrUrlListingStatusIconProps) {
  return (
    <Button
      variant="ghost"
      size="custom"
      className={cn('relative cursor-default', {
        'bg-success/10 text-success hover:text-success': status === 'success',
        'bg-destructive/10 text-destructive hover:text-destructive':
          status === 'error',
      })}
    >
      <WithTooltip
        tooltip={status === 'success' ? 'Successfully Parsed' : 'Not Parsed'}
        triggerClassName="cursor-default"
      >
        {mapParsedFileOrUrlStatusToIcon(status, className)}
      </WithTooltip>
    </Button>
  );
}

export interface ErrorMessagesProps {
  errorMsgs: string[];
  handleClearErrorMsg: () => void;
}

/**
 * Controlled Alert for displaying error messages
 */
export function ErrorMessages({
  errorMsgs = [],
  handleClearErrorMsg,
}: ErrorMessagesProps) {
  if (!errorMsgs.length) return null;
  // Dedupe the error messages
  const uniqueErrorMsgs = Array.from(new Set(errorMsgs));

  return (
    <Alert
      variant="destructive"
      className="bg-destructive/50 text-destructive-foreground [&>svg]:text-inherit"
    >
      <IconMessageCircleCode className="size-5" />
      <AlertTitle>Doh!</AlertTitle>
      {uniqueErrorMsgs.map((msg, idx) => {
        return (
          <AlertDescription key={idx}>
            <p>{msg}</p>
          </AlertDescription>
        );
      })}
      <Button
        type="button"
        variant="destructive"
        size="icon"
        onClick={() => handleClearErrorMsg()}
        className="absolute right-1.5 top-1.5 size-auto bg-destructive/40 p-2 leading-none"
      >
        <IconClose />
      </Button>
    </Alert>
  );
}

export interface ContentNamespaceInputProps {
  label?: string;
  isDisabled?: boolean;
  projectNamespace?: string;
  handleClearNamespace: () => void;
  handleSetProjectNamespace: (value: string) => void;
}

/**
 * Controlled input for the Content Namespace
 *
 * @note Shared component for the FileUploaderDialog sub-components
 *
 */
export function ContentNamespaceInput({
  label = 'Namespace',
  isDisabled = false,
  projectNamespace: projectNamespaceProp = '',
  handleClearNamespace,
  handleSetProjectNamespace,
}: ContentNamespaceInputProps) {
  return (
    <div className="flex w-full flex-col items-start gap-2 md:flex-row md:items-center">
      <Label htmlFor="projectNamespace" className="min-w-24 leading-normal">
        {label}
      </Label>
      <div className="flex w-full grow gap-2">
        <div className="relative grow">
          <Input
            type="text"
            className=""
            name="projectNamespace"
            disabled={isDisabled}
            placeholder='e.g. "project-name" or "my-segment"'
            value={projectNamespaceProp}
            maxLength={40}
            onChange={(e) => {
              const { value } = e.target;
              // Replace non-alphanumeric characters including a whitespace with an empty-value, except for hyphens
              const sanitizedValue = value
                .replace(/[^a-zA-Z0-9-]/g, '')
                .replace(/[-]{2,}/g, '-');

              handleSetProjectNamespace(sanitizedValue);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            disabled={!projectNamespaceProp || isDisabled}
            onClick={() => handleClearNamespace()}
            className="absolute inset-y-1/4 right-1.5 block size-5 rounded-full p-1 leading-none"
          >
            <IconClose className="size-full" />
          </Button>
        </div>
        <WithTooltip tooltip="Optional: Sorts your files into a 'folder' for easier searching. Useful if you organize your projects or content in specific ways or by segments.">
          <IconCircleHelp className="text-foreground/60" />
        </WithTooltip>
      </div>
    </div>
  );
}

export interface ContentPartnerInputProps {
  label?: string;
  isDisabled?: boolean;
  projectPartner?: string;
  handleClearPartner: () => void;
  handleSetPartner: (value: string) => void;
}

/**
 * Controlled input for the Content Partner
 *
 * @note Shared component for the FileUploaderDialog sub-components
 *
 */
export function ContentPartnerInput({
  label = 'Partner',
  isDisabled = false,
  projectPartner = '',
  handleClearPartner,
  handleSetPartner,
}: ContentPartnerInputProps) {
  return (
    <div className="flex w-full flex-col items-start gap-2 md:flex-row md:items-center">
      <Label htmlFor="projectPartner" className="min-w-24 leading-normal">
        {label}
      </Label>
      <div className="flex w-full grow gap-2">
        <div className="relative grow">
          <Input
            type="text"
            className=""
            name="projectPartner"
            disabled={isDisabled}
            placeholder="e.g. Travel Nevada"
            value={projectPartner}
            maxLength={40}
            onChange={(e) => {
              const { value } = e.target;
              // Replace non-alphanumeric characters including a whitespace with an empty-value, except for hyphens
              const sanitizedValue = value;

              handleSetPartner(sanitizedValue);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            disabled={!projectPartner || isDisabled}
            onClick={() => handleClearPartner()}
            className="absolute inset-y-1/4 right-1.5 block size-5 rounded-full p-1 leading-none"
          >
            <IconClose className="size-full" />
          </Button>
        </div>
        <WithTooltip tooltip="Optional: Associate the content with a specific partner.">
          <IconCircleHelp className="text-foreground/60" />
        </WithTooltip>
      </div>
    </div>
  );
}

export type ContentDescriptorInputProps = {
  className?: string;
  maxLength?: number;
  isDisabled?: boolean;
  descriptor?: string;
  children?: React.ReactNode;
  handleClearDescriptor: () => void;
  handleSetDescriptor: (value: string) => void;
};

/**
 * Controlled input for the Content Namespace
 *
 * @note Shared component for the FileUploaderDialog sub-components
 *
 */
export function ContentDescriptorInput({
  className,
  children,
  maxLength = 3250,
  isDisabled = false,
  descriptor: descriptorProp = '',
  handleClearDescriptor,
  handleSetDescriptor,
}: ContentDescriptorInputProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-start gap-2 md:flex-row',
        className
      )}
    >
      <Label htmlFor="projectNamespace" className="min-w-24 leading-normal">
        Descriptor
      </Label>
      <div className="flex grow flex-col gap-2">
        <div className="flex w-full grow gap-2">
          <div className="relative grow">
            <Textarea
              className="min-h-[60px]"
              name="projectDescriptor"
              disabled={isDisabled}
              placeholder="e.g. Helpful descriptor"
              value={descriptorProp}
              maxLength={maxLength}
              onChange={(e) => {
                const { value } = e.target;
                const sanitizedValue = value;

                handleSetDescriptor(sanitizedValue);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              disabled={!descriptorProp || isDisabled}
              onClick={() => handleClearDescriptor()}
              className="absolute right-1.5 top-3 block size-5 rounded-full p-1 leading-none"
            >
              <IconClose className="size-full" />
            </Button>
          </div>
          <WithTooltip tooltip="Optional: Provide your content with a relevant descriptor.">
            <IconCircleHelp className="text-foreground/60" />
          </WithTooltip>
        </div>
        {children}
      </div>
    </div>
  );
}

export type ContentSourceUrlInputProps = {
  label?: string;
  maxLength?: number;
  isDisabled?: boolean;
  value?: string;
  handleClearingValue: () => void;
  handleSettingValue: (value: string) => void;
};

/**
 * Controlled input for the Content Source Url
 *
 * Handy for providing a source URL for an uploaded file(s) for reference
 *
 */
export function ContentSourceUrlInput({
  label = 'Source',
  isDisabled = false,
  value: valueProp = '',
  handleClearingValue,
  handleSettingValue,
}: ContentSourceUrlInputProps) {
  return (
    <div className="flex w-full flex-col items-start gap-2 md:flex-row md:items-center">
      <Label htmlFor="projectUrlSource" className="min-w-24 leading-normal">
        {label}
      </Label>
      <div className="flex w-full grow gap-2">
        <div className="relative grow">
          <Input
            type="text"
            className=""
            name="projectUrlSource"
            disabled={isDisabled}
            placeholder="e.g. https://example.com/file.pdf"
            value={valueProp}
            maxLength={250}
            onChange={(e) => {
              const { value } = e.target;
              // Replace non-alphanumeric characters including a whitespace with an empty-value, except for hyphens
              const sanitizedValue = (value || '').trim();

              handleSettingValue(sanitizedValue);
            }}
            onBlur={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Add https:// if not present
              const { value: urlVal } = e.target;
              if (!urlVal) {
                handleSettingValue('');
                return;
              }
              console.log(`urlValue`, urlVal);
              if (!urlVal.startsWith('http') || urlVal.startsWith('//')) {
                // const isValid = z
                //   .string()
                //   .url()
                //   .regex(/^(?!http.*$).*/, {
                //     message: 'Only user username, not full domain',
                //   })
                //   .safeParse(urlVal);
                // console.log(`isValid`, isValid);

                // Replace the current URL value if it begins with // before setting
                const newUrlVal = urlVal.replace(/^\/\//, '');
                handleSettingValue(`https://${newUrlVal}`);
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            disabled={isDisabled}
            onClick={() => handleClearingValue()}
            className="absolute inset-y-1/4 right-1.5 block size-5 rounded-full p-1 leading-none"
          >
            <IconClose className="size-full" />
          </Button>
        </div>
        <WithTooltip tooltip="Optional: Handy for cross-referencing file content to an online source of truth/originating reference.">
          <IconCircleHelp className="text-foreground/60" />
        </WithTooltip>
      </div>
    </div>
  );
}

export type ContentSourceTitleInputProps = {
  maxLength?: number;
  isDisabled?: boolean;
  value?: string;
  label?: string;
  handleClearingValue: () => void;
  handleSettingValue: (value: string) => void;
};

/**
 * Controlled input for the Content Source Title
 *
 * Handy for providing a source URL for an uploaded file(s) for reference
 *
 */
export function ContentSourceTitleInput({
  label = 'Title',
  isDisabled = false,
  value: valueProp = '',
  handleClearingValue,
  handleSettingValue,
}: ContentSourceTitleInputProps) {
  return (
    <div className="flex w-full flex-col items-start gap-2 md:flex-row md:items-center">
      <Label htmlFor="projectTitle" className="min-w-24 leading-normal">
        {label}
      </Label>
      <div className="flex w-full grow gap-2">
        <div className="relative grow">
          <Input
            type="text"
            className=""
            name="projectTitle"
            disabled={isDisabled}
            placeholder="e.g. Some Relevant Title"
            value={valueProp}
            maxLength={100}
            onChange={(e) => {
              const { value } = e.target;
              // Replace non-alphanumeric characters including a whitespace with an empty-value, except for hyphens
              const sanitizedValue = value || '';

              handleSettingValue(sanitizedValue);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            disabled={isDisabled}
            onClick={() => handleClearingValue()}
            className="absolute inset-y-1/4 right-1.5 block size-5 rounded-full p-1 leading-none"
          >
            <IconClose className="size-full" />
          </Button>
        </div>
        <WithTooltip tooltip="Optional: Handy for providing the uploaded file content a specific title">
          <IconCircleHelp className="text-foreground/60" />
        </WithTooltip>
      </div>
    </div>
  );
}

/**
 * Common Success Animated Component
 */
export function SuccessAnimated({
  className,
  animatedClassName,
}: {
  className?: string;
  animatedClassName?: string;
}) {
  return (
    <div className={cn('mx-auto size-28', className)}>
      <AnimatedSuccessCheck
        className={cn('text-success-foreground size-full', animatedClassName)}
      />
    </div>
  );
}

/**
 * Common CTA Buttons on Successful Upload
 */
export function SuccessCTAButtons({
  queryLabel = 'Query Content',
  resetLabel = 'Upload New Content',
  handleQueryContent,
  handleReset,
  className,
  disabled,
}: {
  queryLabel?: string;
  resetLabel?: string;
  disabled?: boolean;
  handleQueryContent?: () => void;
  handleReset: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}) {
  return (
    <>
      <Link
        href="/"
        className={cn(
          'gap-1.5',
          buttonVariants({
            variant: 'secondary',
          })
        )}
      >
        <IconFileSearch className="size-4" />
        <span>{queryLabel}</span>
      </Link>
      <Button
        type="button"
        variant="default"
        onClick={handleReset}
        className="gap-1.5"
      >
        <IconFileUpload className="size-4" />
        <span>{resetLabel}</span>
      </Button>
    </>
  );
}

export type GeneralTextAreaInputProps = {
  tooltip?: string;
  inputPlaceholder?: string;
  inputClassName?: string;
  inputName: string;
  label?: string;
  labelClassName?: string;
  className?: string;
  maxLength?: number;
  isDisabled?: boolean;
  descriptor?: string;
  children?: React.ReactNode;
  handleClearDescriptor: () => void;
  handleSetDescriptor: (value: string) => void;
};

/**
 * Controlled general input
 *
 * @note Shared component for the FileUploaderDialog sub-components
 *
 */
export function GeneralTextAreaInput({
  tooltip,
  inputName,
  inputClassName,
  inputPlaceholder,
  label = 'General Text Area',
  labelClassName,
  className,
  children,
  maxLength = 3250,
  isDisabled = false,
  descriptor: descriptorProp = '',
  handleClearDescriptor,
  handleSetDescriptor,
}: GeneralTextAreaInputProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-start gap-2 md:flex-row',
        className
      )}
    >
      <Label htmlFor={inputName} className="min-w-24 leading-normal">
        {label}
        {tooltip && (
          <WithTooltip tooltip={tooltip}>
            <IconCircleHelp className="text-foreground/60" />
          </WithTooltip>
        )}
      </Label>
      <div className="flex w-full grow flex-col gap-2">
        <div className="flex w-full grow gap-2">
          <div className="relative grow">
            <Textarea
              className={cn('min-h-[60px] w-full', inputClassName)}
              name={inputName}
              disabled={isDisabled}
              placeholder={inputPlaceholder}
              value={descriptorProp}
              maxLength={maxLength}
              onChange={(e) => {
                const { value } = e.target;
                const sanitizedValue = value;
                handleSetDescriptor(sanitizedValue);
              }}
            />
            {descriptorProp && (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                disabled={isDisabled}
                onClick={() => handleClearDescriptor()}
                className="absolute right-1.5 top-3 block size-5 rounded-full p-1 leading-none"
              >
                <IconClose className="size-full" />
              </Button>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
