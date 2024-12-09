'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { Badge } from '../../ui/badge';
import {
  IconCirclePlus,
  IconClose,
  IconEyeView,
  IconSpinner,
  IconTrash,
} from '../../ui/icons';
import {
  ContentDescriptorInput,
  ContentNamespaceInput,
  ContentSourceTitleInput,
  ErrorMessages,
  mapUrlTypeToIcon,
  ParsedFileOrUrlListingStatusIcon,
  SuccessAnimated,
  SuccessCTAButtons,
  WithTooltip,
} from '../common/shared-components';
import { handleIngestingParsedFilesContent } from '../common/shared-fetchers';
import type {
  FileInBase64,
  IngestedUrlItem,
  ParsedUrlItem,
} from '../files/file-uploader-types';
import { PreviewParsedUrlDialog } from './preview-parsed-url-dialog';
import { parseUrlContent } from './url-form-utils';

export type UploadContentStage = 'identify' | 'parsed' | 'uploaded';

export const DEFAULT_MAX_ITEMS = 3;

export interface ParsedUrlViewContentsProps {
  label?: string;
  className?: string;
  iconClassName?: string;
  parsedFile: ParsedUrlItem;
  filePreview?: FileInBase64;
  onViewParsedFile: (file: ParsedUrlItem, preview?: FileInBase64) => void;
}

export function ParsedUrlViewContents({
  className,
  iconClassName,
  onViewParsedFile,
  filePreview,
  parsedFile,
  label,
}: ParsedUrlViewContentsProps) {
  if (!parsedFile) return null;
  return (
    <Button
      variant="ghost"
      size="custom"
      className={cn(
        'relative cursor-pointer gap-1 hover:bg-transparent',
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onViewParsedFile(parsedFile, filePreview);
      }}
    >
      <WithTooltip tooltip={'View Parsed URL Contents'} triggerClassName="">
        <IconEyeView className={cn('size-4', iconClassName)} />
      </WithTooltip>
      {label}
    </Button>
  );
}

export interface UrlPreviewOverviewProps {
  parsedUrl: ParsedUrlItem;
  iconUrlClassName?: string;
  className?: string;
  filenameClassName?: string;
  noUserActions?: boolean;
  noShowUrl?: boolean;
  noTrimUrl?: boolean;
  withUrlPrefix?: boolean;
  handleViewingParsedUrl?: (parsedFile: ParsedUrlItem) => void;
}

/**
 * Provides an overview of a parsed URL (metadata)
 */
export function UrlPreviewOverview({
  withUrlPrefix = false,
  noTrimUrl = false,
  noShowUrl = false,
  noUserActions,
  parsedUrl,
  iconUrlClassName,
  filenameClassName,
  className,
  handleViewingParsedUrl,
}: UrlPreviewOverviewProps) {
  if (!parsedUrl) {
    return null;
  }

  const parsedUrlStatus = parsedUrl?.status;
  const parseSucceeded = parsedUrlStatus === 'success';

  return (
    <div className={cn('flex grow items-center justify-between', className)}>
      <div
        className={cn(
          'flex w-full content-start items-center justify-start gap-2'
        )}
      >
        <div className="flex max-w-full grow flex-col gap-1.5 text-sm leading-none">
          {!noShowUrl && (
            <div className={cn('inline-block truncate', filenameClassName)}>
              {!noTrimUrl && parsedUrl.url.length > 42
                ? `${parsedUrl.url.slice(0, 42)}...`
                : parsedUrl.url}
            </div>
          )}
          <div className="flex w-full items-center justify-between gap-1.5 text-foreground/60">
            {/* TODO: Implement these meta details for URLs */}
            {/* <div className="flex items-center gap-1.5">
                <span className="">{nFormatter(file.size)}</span> &#8226;{' '}
                <span>Mod: {timeAgo(new Date(file.lastModified))}</span>
              </div> */}

            <div className="flex items-center gap-1.5">
              <div className="">
                {mapUrlTypeToIcon(parsedUrl.url, iconUrlClassName, 'size-4')}
              </div>
              {parsedUrlStatus && (
                <span className="flex items-center gap-1">
                  {
                    <ParsedFileOrUrlListingStatusIcon
                      status={parsedUrl.status}
                    />
                  }
                  <Badge variant="outline" className="">
                    {parseSucceeded ? 'Parsed' : 'Error'}
                  </Badge>
                </span>
              )}
              {!noUserActions && (
                <span className="flex items-center gap-1.5">
                  {handleViewingParsedUrl && (
                    <ParsedUrlViewContents
                      label="Preview"
                      parsedFile={parsedUrl}
                      // filePreview={filePreview}
                      onViewParsedFile={handleViewingParsedUrl}
                    />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Form schema for the URL uploader form
 */
const formSchema = z.object({
  urls: z.array(
    z.object({
      url: z.string().url({
        message: 'Please enter a valid URL',
      }),
      title: z.string(),
    })
  ),
});

type UrlItem = z.infer<typeof formSchema>['urls'][number];

const initialState: UrlItem[] = [{ url: '', title: '' }];

export function UrlUploaderForm({
  className,
  maxItems = DEFAULT_MAX_ITEMS,
  projectNamespace: projectNamespaceProp = '',
  projectTitle: projectUrlTitleProp = '',
  noInputFields,
}: {
  projectNamespace?: string;
  projectTitle?: string;
  className?: string;
  maxItems?: number;
  noInputFields?: boolean;
}) {
  // 0. Local state
  const [items, setItems] = useLocalStorage<UrlItem[]>(
    'url-uploader-items',
    initialState
  );

  // Project namespace
  const [projectNamespace, setProjectNamespace] = useLocalStorage<string>(
    'project-namespace',
    projectNamespaceProp
  );

  // Project descriptor
  const [projectDescriptor, setProjectDescriptor] = useLocalStorage<string>(
    'project-descriptor',
    projectNamespaceProp
  );

  // URL Title
  const [projectTitle, setProjectTitle] = useLocalStorage<string>(
    'project-url-title',
    projectUrlTitleProp
  );

  // Track error messages
  const [errorMsg, setErrorMsg] = useState<string[]>([]);

  // Track the stage of the content, e.g. attached, parsed, uploaded
  const [contentStage, setContentStage] =
    useState<UploadContentStage>('identify');

  // Track the parsed files content and preview them if needed
  const [parsedUrls, setParsedUrl] = useState<ParsedUrlItem[]>([]);

  const [parsedUrlToPreview, setParsedUrlToPreview] = useState<{
    item: ParsedUrlItem;
    preview?: FileInBase64;
  } | null>(null);

  // Track the uploaded files content
  const [uploadedFiles, setUploadedFiles] = useState<IngestedUrlItem[]>([]);

  // Define form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { urls: items },
    // mode: 'onBlur',
  });

  // Form states, values and handlers
  const { getValues, formState, trigger, reset, setValue } = form;
  const { isLoading, isSubmitting, errors } = formState;
  const formValues = getValues('urls');
  const formUrls = formValues.map((item) => item.url).filter(Boolean);

  // Instantiate a field array for dynamic fields.
  // @see https://react-hook-form.com/docs/usefieldarray
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'urls',
  });

  // Flags for convenience
  const maxItemsReached = fields.length >= maxItems;

  const hasProcessErrors = Boolean(errorMsg.length);
  // const hasFormErrors = Object.keys(errors).length > 0;
  const isInIdentifiedStage = contentStage === 'identify';
  const isInParsedStage = contentStage === 'parsed';
  const isInUploadedStage = contentStage === 'uploaded';
  const isProcessing = isLoading || isSubmitting;
  const showSuccessVisual = isInUploadedStage && !isProcessing;

  const numOfFormUrls = formUrls.length || 0;
  const numOfparsedUrls = parsedUrls?.length || 0;
  const numOfUploadedFiles = uploadedFiles?.length || 0;
  const numOfDifferentUrls = numOfFormUrls - numOfparsedUrls;

  const areAllFormUrlsParsed = numOfFormUrls
    ? formUrls.every((url) => {
        return parsedUrls.some(
          (pf) => pf.url === url && pf.status === 'success'
        );
      })
    : true;

  // const doUrlEntriesMatch = formUrls.every((url) => {
  //   return parsedUrls.some((pf) => pf.url === url);
  // });
  // console.log(`doUrlEntriesMatch`, doUrlEntriesMatch);
  // const areAttachedAndparsedUrlsEqual =
  //   numOfFormUrls > 0 && doUrlEntriesMatch && numOfDifferentUrls === 0;

  const hasParsedUrls = Boolean(numOfparsedUrls);

  const disableActions = isProcessing;

  //--- Handlers

  // Handle clearing namespace
  const handleClearNamespace = () => {
    setProjectNamespace('');
  };

  const handleClearProjectTitle = () => {
    setProjectTitle('');
  };

  const handleClearProjectDescriptor = () => {
    setProjectDescriptor('');
  };

  // Handle updating and clearing error messages
  const handleUpdateErrorMsg = (msg: string) => {
    setErrorMsg((prev) => [...prev, msg]);
  };

  const handleClearErrorMsg = () => {
    setErrorMsg([]);
  };

  // Handle removing the parsed file to preview
  const handleRemoveParsedFileToPreview = () => {
    setParsedUrlToPreview(null);
  };

  // Handle previewing the parsed content
  const handlePreviewParsedContent = (
    pi: ParsedUrlItem,
    base64Preview?: FileInBase64
  ) => {
    if (pi?.content) {
      setParsedUrlToPreview({
        item: pi,
        preview: base64Preview,
      });
    }
  };

  const handleAppendingSingleItem = (item: UrlItem) => {
    setItems([...items, item]);
  };

  const handleResetForm = () => {
    reset();
    handleClearErrorMsg();
    setParsedUrl([]);
    setUploadedFiles([]);
    handleClearNamespace();
    handleClearProjectTitle();
    handleClearProjectDescriptor();
    setContentStage('identify');
  };

  // Handle appending multiple items
  const handleAddingNewRow = (item: UrlItem) => {
    append(item);
    // Add the item to the local state or storage if needed
  };

  // Handle removing a single item
  const handleRemovingRow = (
    index: number,
    url?: string,
    removeParsedContent = false
  ) => {
    remove(index);
    // Remove the item from the local state
    if (removeParsedContent) {
      setParsedUrl((prev) =>
        prev.filter((pi, i) => {
          return pi.url !== url;
        })
      );
    }
  };

  // Handle adding a row to the parsed items list
  const handleAddingParsedRow = (item: ParsedUrlItem) => {
    setParsedUrl((prev) => {
      return [...prev, item];
    });
  };

  // Submit parser handler
  // @see onSubmit for the gateway
  async function handleParsingUrls(values: z.infer<typeof formSchema>) {
    const formUrls = values.urls.map((item) => item.url);

    // Filter out any URLs that are already parsed
    const urlsToParse = formUrls.filter(
      (url) =>
        !parsedUrls.some((pf) => pf.url === url && pf.status === 'success')
    );

    // Handle each URL one by one to parse the content and preview it
    const parsedItems = await Promise.all(
      urlsToParse.map(async (url, i): Promise<ParsedUrlItem> => {
        const parsedResponse = await parseUrlContent(url);

        if (parsedResponse.success) {
          const parsedPages = parsedResponse.pages;
          const msg = parsedPages.length
            ? `Parsed content successfully`
            : `No content found for URL ${url}`;

          const pi = {
            url,
            content: parsedPages,
            status: parsedPages.length ? 'success' : 'error',
            msg: msg,
          } as ParsedUrlItem;

          // If we have content, set the parsed file in state
          if (parsedPages.length) {
            handleAddingParsedRow(pi);
          }

          return pi;
        } else {
          throw new Error(
            parsedResponse.meta?.errorMsg || `Error parsing url: ${url}`
          );
        }
      })
    );

    // Track if content in any of the files was successfully parsed
    const hasParsedContent = parsedItems
      .flat()
      .some((pf) => pf.content?.length);

    // Track the number of successful parsed files
    const countSuccessfulParsedUrls = hasParsedContent
      ? parsedItems.filter((pf) => pf.status === 'success').length
      : 0;

    // Track the number of failed parsed files
    const countFailedParsedUrls = parsedItems.filter(
      (f) => f.status === 'error'
    ).length;

    // Bump the content stage to the next step
    if (countSuccessfulParsedUrls > 0) {
      setContentStage('parsed');
    } else {
      setContentStage('identify');
    }

    // Notify the user of any errors
    if (countFailedParsedUrls) {
      if (countFailedParsedUrls === 0) {
        handleUpdateErrorMsg('No files were not successfully parsed');
      } else {
        const failedParsedFiles = parsedItems.filter(
          (f) => f.status === 'error'
        );

        failedParsedFiles.forEach((f) => {
          handleUpdateErrorMsg(f.msg || 'Error parsing file content');
        });
      }
    }

    return true;
  }

  // Submit ingest/uploader handler
  // @see onSubmit for the gateway
  async function handleIngestParsedFiles(values: z.infer<typeof formSchema>) {
    const formUrls = values.urls.map((item) => item.url);

    // Filter for form URLs that are already parsed
    const urlsToIngest = parsedUrls.filter((pi) =>
      formUrls.some((url) => pi.url === url && pi.status === 'success')
    );

    if (!urlsToIngest.length) {
      toast.error('No content to ingest');
    }

    // Iterate through each file one by one in order to show progress
    const ingestFiles: IngestedUrlItem[] = await Promise.all(
      urlsToIngest.map(async (pi): Promise<IngestedUrlItem> => {
        try {
          const ingestResponse = await handleIngestingParsedFilesContent(pi, {
            namespace: projectNamespace,
            // @note - we are using the project descriptor content for now but only if we're not using the descriptor content for the file
            description: projectDescriptor,
            // sourceUrl: urlSource,
            sourceTitle: projectTitle, // No title for now
            dryrun: false, // Dryrun
          });

          if (ingestResponse.success) {
            const ingestedDocs = ingestResponse.docs;
            const ingestedPages = ingestResponse.pages;

            const msg = ingestedDocs.length
              ? 'URL content ingested successfully'
              : `No content found for URL: ${pi.url}`;

            const ingestedUrl: IngestedUrlItem = {
              url: pi.url,
              pages: ingestedPages,
              docs: ingestedDocs,
              status: ingestedDocs.length ? 'success' : 'error',
              msg,
            };

            // Set the ingested file in the state
            if (ingestedDocs.length) {
              setUploadedFiles((prev) => [...prev, ingestedUrl]);
            }

            return ingestedUrl;
          } else {
            throw new Error(
              ingestResponse.meta?.errorMsg || 'Error ingesting files'
            );
          }
        } catch (error) {
          const errMsg = getErrorMessage(error);
          console.error('Error ingesting file content: ', errMsg);
          toast.error(errMsg);
          handleUpdateErrorMsg(errMsg);
          return {
            ...pi,
            url: pi.url,
            pages: [],
            docs: [],
            status: 'error',
            msg: errMsg,
          };
        }
      })
    );

    // Track if content in any of the files was successfully ingested
    const hasIngestedContent = ingestFiles.flat().some((f) => f.docs?.length);
    // console.log(`hasIngestedContent`, hasIngestedContent);

    // Track the number of successful ingested files
    const countSuccessfulIngestedUrls = hasIngestedContent
      ? ingestFiles.filter((f) => f.status === 'success').length
      : 0;
    // console.log(`countSuccessfulIngestedUrls`, countSuccessfulIngestedUrls);

    // Track the number of failed ingested files
    const countFailedIngestedFiles = ingestFiles.filter(
      (f) => f.status === 'error'
    ).length;
    // console.log(`countFailedIngestedFiles`, countFailedIngestedFiles);

    // Bump the content stage to the next step
    if (countSuccessfulIngestedUrls > 0) {
      // Bump the content stage to the next step
      setContentStage('uploaded');
    } else {
      setContentStage('parsed');
    }

    if (countFailedIngestedFiles) {
      if (countFailedIngestedFiles === 0) {
        handleUpdateErrorMsg('All URLs were not successfully ingested');
      } else {
        const failedIngestedFiles = ingestFiles.filter(
          (f) => f.status === 'error'
        );

        failedIngestedFiles.forEach((f) => {
          handleUpdateErrorMsg(f.msg || 'Error parsing URL content');
        });
      }
    }

    return true;
  }

  //==== Primary Submit Hndler Gateway
  // Determines which handler to call based on the current stage
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    let processSuccess = false;

    try {
      // Clear out any previous error messages
      handleClearErrorMsg();

      // Parse the URL content
      if (isInIdentifiedStage || !areAllFormUrlsParsed) {
        processSuccess = await handleParsingUrls(values);
      } else if (isInParsedStage && areAllFormUrlsParsed) {
        processSuccess = await handleIngestParsedFiles(values);
      }
    } catch (error) {
      const errMsg = getErrorMessage(error);
      console.error(errMsg);
      handleUpdateErrorMsg(errMsg);
      toast.error(errMsg);
    }

    return processSuccess;
  }

  return (
    <div>
      <Form {...form}>
        <form
          // aria-disabled={disableActions}
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn('flex flex-col', {
            'gap-6 py-4': showSuccessVisual,
            'gap-3': !showSuccessVisual,
          })}
        >
          {showSuccessVisual && <SuccessAnimated />}
          {hasProcessErrors && (
            <ErrorMessages
              errorMsgs={errorMsg}
              handleClearErrorMsg={handleClearErrorMsg}
            />
          )}
          <div
            className={cn('flex flex-col gap-4', {
              hidden: showSuccessVisual,
            })}
          >
            <div className="w-full space-y-3">
              {fields.map((field, index) => {
                const urlVal = field.url;
                return (
                  <div key={field.id} className="flex w-full gap-2">
                    <FormField
                      control={form.control}
                      name={`urls.${index}.url`}
                      render={({ field, fieldState, formState }) => {
                        const isDisabled = fields.length === 1;
                        const parsedUrl = parsedUrls.find(
                          (pf) =>
                            pf.url === field.value && pf.status === 'success'
                        );

                        return (
                          <FormItem className="w-full">
                            <FormLabel>Website (URL)</FormLabel>
                            <div className="flex w-full flex-col gap-1">
                              <div className="flex w-full gap-2">
                                <div className="relative w-full">
                                  <FormControl className="relaive">
                                    <Input
                                      placeholder="https://example.com"
                                      {...field}
                                      onKeyDown={(e) => {
                                        // Account for enter key press
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          e.stopPropagation();
                                        }
                                      }}
                                      onBlur={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Add https:// if not present
                                        const urlVal = e.target.value;
                                        if (
                                          urlVal &&
                                          (!urlVal.startsWith('http') ||
                                            urlVal.startsWith('//'))
                                        ) {
                                          // Replace the current URL value if it begins with // before setting
                                          const newUrlVal = urlVal.replace(
                                            /^\/\//,
                                            ''
                                          );

                                          setValue(
                                            `urls.${index}.url`,
                                            `https://${newUrlVal}`
                                          );
                                          // Revalidate the field
                                          trigger(`urls.${index}.url`);
                                        }

                                        // Trigger the parent onBlur
                                        field.onBlur();
                                      }}
                                      disabled={disableActions}
                                    />
                                  </FormControl>
                                  <Button
                                    size="custom"
                                    variant="outline"
                                    className="absolute inset-y-1/4 right-1.5 size-auto rounded-full px-1 py-2.5 leading-none"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setValue(`urls.${index}.url`, '');
                                    }}
                                  >
                                    <IconClose className="size-3" />
                                  </Button>
                                </div>
                                <Button
                                  type="button"
                                  disabled={isDisabled}
                                  variant={
                                    isDisabled ? 'secondary' : 'destructive'
                                  }
                                  onClick={() =>
                                    handleRemovingRow(index, urlVal)
                                  }
                                  className="border border-destructive bg-destructive/60"
                                >
                                  <span className="sr-only">Remove</span>
                                  <IconTrash />
                                </Button>
                              </div>
                              {parsedUrl && (
                                <UrlPreviewOverview
                                  noShowUrl
                                  parsedUrl={parsedUrl}
                                  handleViewingParsedUrl={
                                    handlePreviewParsedContent
                                  }
                                />
                              )}
                            </div>
                            <FormMessage>
                              {fieldState.error?.message}
                            </FormMessage>
                          </FormItem>
                        );
                      }}
                    />
                    {/* <FormField
                control={form.control}
                name={`urls.${index}.title`}
                render={({ field, fieldState, formState }) => {
                  return (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Example" {...field} />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  );
                }}
              /> */}
                  </div>
                );
              })}
            </div>
            <div className="flex w-full justify-start">
              <Button
                type="button"
                variant={maxItemsReached ? 'outline' : 'secondary'}
                disabled={maxItemsReached || disableActions}
                onClick={() =>
                  handleAddingNewRow({
                    url: '',
                    title: '',
                  })
                }
                className="gap-1.5"
              >
                <span>Add</span>
                <IconCirclePlus />
              </Button>
            </div>
          </div>
          {!showSuccessVisual && !noInputFields && (
            <ContentSourceTitleInput
              label="Content Title"
              isDisabled={isProcessing || isInUploadedStage}
              value={projectTitle}
              handleClearingValue={handleClearProjectTitle}
              handleSettingValue={setProjectTitle}
            />
          )}
          {!showSuccessVisual && !noInputFields && (
            <ContentDescriptorInput
              isDisabled={isProcessing || isInUploadedStage}
              descriptor={projectDescriptor}
              handleClearDescriptor={handleClearProjectDescriptor}
              handleSetDescriptor={setProjectDescriptor}
            />
          )}
          {!showSuccessVisual && !noInputFields && (
            <ContentNamespaceInput
              isDisabled={isProcessing || isInUploadedStage}
              projectNamespace={projectNamespace}
              handleClearNamespace={handleClearNamespace}
              handleSetProjectNamespace={setProjectNamespace}
            />
          )}
          <div className="flex w-full justify-end gap-2">
            {/* Post-Upload Action Buttons */}
            {showSuccessVisual && (
              <SuccessCTAButtons
                disabled={isProcessing}
                handleReset={handleResetForm}
              />
            )}
            {/* Pre-Upload Action Buttons */}
            {!showSuccessVisual && (
              <Button
                type="button"
                variant="ghost"
                disabled={disableActions}
                onClick={handleResetForm}
                className={cn({
                  'brightness-50 hover:brightness-100': !showSuccessVisual,
                })}
              >
                Reset
              </Button>
            )}
            {/* Parsing Button */}
            {(isInIdentifiedStage || !areAllFormUrlsParsed) && (
              <Button
                disabled={disableActions}
                type="submit"
                className="gap-1.5"
              >
                {isSubmitting && <IconSpinner className="animate-spin" />}
                <span>{isSubmitting ? 'Parsing...' : 'Parse'}</span>
              </Button>
            )}
            {/* Ingest/Upload Button */}
            {isInParsedStage && areAllFormUrlsParsed && (
              <Button
                disabled={disableActions}
                type="submit"
                className="gap-1.5"
              >
                {isSubmitting && <IconSpinner className="animate-spin" />}
                <span>{isSubmitting ? 'Uploading...' : 'Upload'}</span>
              </Button>
            )}
          </div>
        </form>
      </Form>
      {/* Preview a File's Parsed Content */}
      {parsedUrlToPreview && (
        <PreviewParsedUrlDialog
          open
          url={parsedUrlToPreview}
          handleOnClose={handleRemoveParsedFileToPreview}
        />
      )}
    </div>
  );
}
