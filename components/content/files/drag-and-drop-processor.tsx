'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { getErrorMessage } from '@/lib/errors';
import {
  createFormDataFromFiles,
  DEFAULT_FILES_UPLOAD_KEY,
  getAllFilesFromFormData,
} from '@/lib/forms/form-utils';
import { ACCEPTED_INGEST_SIMPLE_CONTENT_MEDIA_TYPES } from '@/lib/images';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { IconSpinner } from '@/components/ui/icons';

import { Badge } from '../../ui/badge';
import {
  ContentDescriptorInput,
  ContentNamespaceInput,
  ContentPartnerInput,
  ContentSourceTitleInput,
  ContentSourceUrlInput,
  ErrorMessages,
  SuccessAnimated,
  SuccessCTAButtons,
} from '../common/shared-components';
import {
  DEFAULT_API_INGEST_ENDPOINT,
  DEFAULT_API_PARSER_ENDPOINT,
  handleFetchingParsedFileContent,
  handleIngestingParsedFilesContent,
} from '../common/shared-fetchers';
import {
  FileUploaderWithRef,
  useWithFileUpload,
  type FileUploaderProps,
} from './file-uploader';
import type {
  FileInBase64,
  IngestedFile,
  ParsedFile,
} from './file-uploader-types';
import { PreviewParsedFileDialog } from './preview-parsed-file-dialog';

export type UploadContentStage = 'attach' | 'parsed' | 'uploaded';

export interface FileDragAndDropFormViewProps {
  apiParserEndpoint?: string;
  apiIngestEndpoint?: string;
  apiFilesKey?: string;
  formUploader?: FileUploaderProps;
  projectNamespace?: string;
  projectUrlSource?: string;
  projectUrlTitle?: string;
  className?: string;
  noInputFields?: boolean;
}

export function FileDragAndDropFormView({
  apiParserEndpoint = DEFAULT_API_PARSER_ENDPOINT,
  apiIngestEndpoint = DEFAULT_API_INGEST_ENDPOINT,
  apiFilesKey = DEFAULT_FILES_UPLOAD_KEY,
  formUploader: formUploaderProps,
  projectNamespace: projectNamespaceProp = '',
  projectUrlSource: projectUrlSourceProp = '',
  projectUrlTitle: projectUrlTitleProp = '',
  noInputFields = false,
  className,
}: FileDragAndDropFormViewProps) {
  const formRef = React.useRef<HTMLFormElement>(null);

  // Project namespace
  const [projectNamespace, setProjectNamespace] = useLocalStorage<string>(
    'project-namespace',
    projectNamespaceProp
  );

  // Project partner
  const [projectPartner, setProjectPartner] = useLocalStorage<string>(
    'project-partner',
    ''
  );

  // Project descriptor
  const [projectDescriptor, setProjectDescriptor] = useLocalStorage<string>(
    'project-descriptor',
    projectNamespaceProp
  );

  // Project use descriptor content
  const [useDescriptorContent, setUseDescriptorContent] =
    useLocalStorage<boolean>('project-use-descriptor-content', false);

  // URL Source
  const [urlSource, setUrlSource] = useLocalStorage<string>(
    'project-url-source',
    projectUrlSourceProp
  );

  // URL Title
  const [urlTitle, setUrlTitle] = useLocalStorage<string>(
    'project-url-title',
    projectUrlTitleProp
  );

  // Track error messages
  const [errorMsg, setErrorMsg] = React.useState<string[]>([]);

  // Track the stage of the content, e.g. attached, parsed, uploaded
  const [contentStage, setContentStage] =
    React.useState<UploadContentStage>('attach');

  // Track the parsed files content and preview them if needed
  const [parsedFiles, setParsedFiles] = React.useState<ParsedFile[]>([]);
  const [parsedFileToPreview, setParsedFileToPreview] = React.useState<{
    item: ParsedFile;
    preview?: FileInBase64;
  } | null>(null);

  // Track the uploaded files content
  const [uploadedFiles, setUploadedFiles] = React.useState<IngestedFile[]>([]);

  const {
    files: providerFiles,
    status: providerStatus,
    setStatus: setFileUploadStatus,
    resetFiles: resetProviderFiles,
    resetSlate: resetSlateEditor,
  } = useWithFileUpload();

  const {
    files: filesProp,
    noTitle = true,
    noDescription = true,
    validTypes = ACCEPTED_INGEST_SIMPLE_CONTENT_MEDIA_TYPES,
  } = formUploaderProps || {};

  //--- Handlers

  // Handle clearing namespace and other fields
  const handleClearNamespace = () => {
    setProjectNamespace('');
  };

  const handleClearProjectPartner = () => {
    setProjectPartner('');
  };

  const handleClearProjectDescriptor = () => {
    setProjectDescriptor('');
  };

  const handleClearUseDescriptorContent = () => {
    setUseDescriptorContent(false);
  };

  const handleClearUrlSource = () => {
    setUrlSource('');
  };

  const handleClearUrlTitle = () => {
    setUrlTitle('');
  };

  // Handle removing files
  // @note - the FileUploader already handles the removal of provider files so this focuses on the parsed files to keep things nsync
  const handleRemoveFile = (file: File) => {
    if (parsedFiles.length === 0) return;
    const updatedParsedFiles = parsedFiles.filter(
      (pf) => pf.file.name !== file.name
    );
    setParsedFiles(updatedParsedFiles);
  };

  // Handle removing the parsed file to preview
  const handleRemoveParsedFileToPreview = () => {
    setParsedFileToPreview(null);
  };

  // Handle previewing the parsed content
  const handlePreviewParsedContent = (
    pf: ParsedFile,
    base64Preview?: FileInBase64
  ) => {
    if (pf?.content) {
      setParsedFileToPreview({
        item: pf,
        preview: base64Preview,
      });
    }
  };

  // Handle updating and clearing error messages
  const handleUpdateErrorMsg = (msg: string) => {
    setErrorMsg((prev) => [...prev, msg]);
  };

  const handleClearErrorMsg = () => {
    setErrorMsg([]);
  };

  // Handle resetting the form and the content stage
  const handleResetForm = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    formRef.current?.reset();
    // Local state reset
    setContentStage('attach');
    setParsedFiles([]);
    setUploadedFiles([]);
    handleClearErrorMsg();
    handleClearNamespace();
    handleClearProjectPartner();
    handleClearProjectDescriptor();
    handleClearUseDescriptorContent();
    handleClearUrlSource();
    handleClearUrlTitle();
    // Reset the provider files and the slate editor
    resetSlateEditor();
  };

  // Flags for convenience
  const hasErrors = Boolean(errorMsg.length);
  const isUploading = providerStatus === 'loading';
  const isInAttachedStage = contentStage === 'attach';
  const isInParsedStage = contentStage === 'parsed';
  const isInUploadedStage = contentStage === 'uploaded';
  const showSuccessVisual = isInUploadedStage && !isUploading;

  const disableUploadBtn = isUploading || !providerFiles?.length;
  const numOfAttachedFiles = providerFiles?.length || 0;
  const numOfParsedFiles = parsedFiles?.length || 0;
  const numOfUploadedFiles = uploadedFiles?.length || 0;
  const numOfDifferentFiles = numOfAttachedFiles - numOfParsedFiles;
  const areAttachedAndParsedFilesEqual =
    numOfDifferentFiles === 0 && numOfAttachedFiles > 0;
  const hasFilesAttached = Boolean(numOfAttachedFiles);
  const hasParsedFiles = Boolean(numOfParsedFiles);

  //======= Handle the upload and parsing of the files (Step 1)
  const handleParsingAttachedFiles = React.useCallback(
    async (formData: FormData) => {
      if (isUploading) return;

      // Get all the files from the form data and provider
      const requestedFormFilesToParse = getAllFilesFromFormData(
        formData,
        apiFilesKey
      );
      const filesToParseFromProvider = providerFiles || [];
      // Combined files to parse and filter for unique files based on the file name
      const consolidatedFilesToParse = [
        ...requestedFormFilesToParse,
        ...filesToParseFromProvider,
      ].filter((file, index, self) => {
        if (file) {
          return self.findIndex((f) => f.name === file.name) === index;
        }
      });

      // Lastly, filter out the files that are already parsed
      const filesToParse = parsedFiles.length
        ? consolidatedFilesToParse.filter((file) => {
            return !parsedFiles.some((pf) => pf.file.name === file.name);
          })
        : consolidatedFilesToParse;

      if (!filesToParse.length) {
        const errMsg = 'No files to parse';
        handleUpdateErrorMsg(errMsg);
        toast.error(errMsg);
        return;
      }

      // Reset to the attached stage
      setContentStage('attach');

      // Remove any error messages
      handleClearErrorMsg();

      // Set the loading status
      setFileUploadStatus('loading');

      // Iterate through each file one by one in order to show progress
      // TODO: Replace with direct call to server action
      const pFiles = await Promise.all(
        filesToParse.map(async (file) => {
          try {
            const fd = createFormDataFromFiles([file], apiFilesKey);
            // Add the project descriptor content if needed
            if (useDescriptorContent && projectDescriptor) {
              fd.append('content', projectDescriptor);
              if (urlTitle) {
                fd.append('title', urlTitle);
              }
            }
            const parsedResponse = await handleFetchingParsedFileContent(
              fd,
              apiParserEndpoint
            );

            if (parsedResponse.success) {
              const parsedPages = parsedResponse.pages;
              const msg = parsedPages.length
                ? 'File content parsed successfully'
                : `No content found in file: ${file.name}`;

              const pf = {
                file,
                content: parsedPages,
                status: parsedPages.length ? 'success' : 'error',
                msg: msg,
              } as ParsedFile;

              // If we have content, set the parsed file in state
              if (parsedPages.length) {
                setParsedFiles((prev) => [...prev, pf]);
              }

              return pf;
            } else {
              throw new Error(
                parsedResponse.meta?.errorMsg || 'Error parsing files'
              );
            }
          } catch (error) {
            const errMsg = getErrorMessage(error);
            console.error('Error parsing file content: ', errMsg);
            toast.error(errMsg);
            handleUpdateErrorMsg(errMsg);
            return {
              file,
              content: null,
              status: 'error',
              msg: errMsg,
            } as ParsedFile;
          }
        })
      );

      // Track if content in any of the files was successfully parsed
      const hasParsedContent = pFiles.flat().some((pf) => pf.content?.length);

      // Track the number of successful parsed files
      const countSuccessfulParsedFiles = hasParsedContent
        ? pFiles.filter((pf) => pf.status === 'success').length
        : 0;

      // Track the number of failed parsed files
      const countFailedParsedFiles = pFiles.filter(
        (f) => f.status === 'error'
      ).length;

      // Bump the content stage to the next step
      if (countSuccessfulParsedFiles > 0) {
        setContentStage('parsed');
      } else {
        setContentStage('attach');
      }

      // Go back to the idle status for the file upload
      setFileUploadStatus('idle');

      // Notify the user of any errors
      if (countFailedParsedFiles) {
        if (countFailedParsedFiles === 0) {
          handleUpdateErrorMsg('No files were not successfully parsed');
        } else {
          const failedParsedFiles = pFiles.filter((f) => f.status === 'error');

          failedParsedFiles.forEach((f) => {
            handleUpdateErrorMsg(f.msg || 'Error parsing file content');
          });
        }
      }
    },
    [providerFiles, parsedFiles]
  );

  //======= Handle ingesting the parsed files content (Step 2)
  const handleIngestParsedFiles = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    if (!parsedFiles) {
      const errMsg = 'No parsed files to ingest';
      // console.error(errMsg);
      toast.error(errMsg);
      return;
    }

    // Remove any error messages
    handleClearErrorMsg();

    // Set the loading status
    setFileUploadStatus('loading');

    // Iterate through each file one by one in order to show progress
    const ingestFiles: IngestedFile[] = await Promise.all(
      parsedFiles.map(async (pf): Promise<IngestedFile> => {
        try {
          const ingestResponse = await handleIngestingParsedFilesContent(pf, {
            namespace: projectNamespace,
            // @note - we are using the project descriptor content for now but only if we're not using the descriptor content for the file
            description: !useDescriptorContent ? projectDescriptor : undefined,
            sourceUrl: urlSource,
            sourceTitle: urlTitle, // No title for now
            dryrun: false, // Dryrun
            storeFile: true, // Store the file
            api: apiIngestEndpoint,
          });

          if (ingestResponse.success) {
            const ingestedDocs = ingestResponse.docs;
            const ingestedPages = ingestResponse.pages;

            const msg = ingestedDocs.length
              ? 'File content ingested successfully'
              : `No content found in file: ${pf.file.name}`;

            const ingestedFile: IngestedFile = {
              pages: ingestedPages,
              docs: ingestedDocs,
              status: ingestedDocs.length ? 'success' : 'error',
              msg,
            };

            // Set the ingested file in the state
            if (ingestedDocs.length) {
              setUploadedFiles((prev) => [...prev, ingestedFile]);
            }

            return ingestedFile;
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
            ...pf,
            pages: [],
            docs: [],
            status: 'error',
            msg: errMsg,
          } as IngestedFile;
        }
      })
    );

    // Track if content in any of the files was successfully ingested
    const hasIngestedContent = ingestFiles.flat().some((f) => f.docs?.length);

    // Track the number of successful ingested files
    const countSuccessfulIngestedFiles = hasIngestedContent
      ? ingestFiles.filter((f) => f.status === 'success').length
      : 0;

    // Track the number of failed ingested files
    const countFailedIngestedFiles = ingestFiles.filter(
      (f) => f.status === 'error'
    ).length;

    // Bump the content stage to the next step
    if (countSuccessfulIngestedFiles > 0) {
      // Bump the content stage to the next step
      setContentStage('uploaded');
      // Notify the user that the files have been uploaded successfully
      setFileUploadStatus('success');
    } else {
      setContentStage('parsed');
    }

    if (countFailedIngestedFiles) {
      if (countFailedIngestedFiles === 0) {
        handleUpdateErrorMsg('No files were not successfully ingested');
      } else {
        const failedIngestedFiles = ingestFiles.filter(
          (f) => f.status === 'error'
        );

        failedIngestedFiles.forEach((f) => {
          handleUpdateErrorMsg(f.msg || 'Error parsing file content');
        });
      }
    }

    setFileUploadStatus('idle');
  };

  return (
    <div
      className={cn('flex flex-col rounded-md', {
        'gap-6 py-4': showSuccessVisual,
        'gap-3': !showSuccessVisual,
      })}
    >
      {showSuccessVisual && <SuccessAnimated />}
      {hasErrors && (
        <ErrorMessages
          errorMsgs={errorMsg}
          handleClearErrorMsg={handleClearErrorMsg}
        />
      )}
      <FileUploaderWithRef
        {...((formUploaderProps as FileUploaderProps) || {})}
        noSubmitBtn
        ref={formRef}
        files={filesProp}
        parsedFiles={parsedFiles}
        validTypes={validTypes}
        noTitle={noTitle}
        noDescription={noDescription}
        onRemoveFile={handleRemoveFile}
        onSubmit={handleParsingAttachedFiles}
        onViewParsedFile={handlePreviewParsedContent}
        // dragAndDropClassName="p-0"
        contentClassName="p-0"
        className={cn(
          'max-w-full border-none',
          {
            hidden: showSuccessVisual,
          },
          formUploaderProps?.className
        )}
      />
      {!showSuccessVisual && !noInputFields && (
        <ContentSourceTitleInput
          isDisabled={isUploading || isInUploadedStage}
          value={urlTitle}
          handleClearingValue={handleClearUrlTitle}
          handleSettingValue={setUrlTitle}
        />
      )}
      {!showSuccessVisual && !noInputFields && (
        <ContentSourceUrlInput
          isDisabled={isUploading || isInUploadedStage}
          value={urlSource}
          handleClearingValue={handleClearUrlSource}
          handleSettingValue={setUrlSource}
        />
      )}
      {!showSuccessVisual && !noInputFields && (
        <ContentDescriptorInput
          isDisabled={isUploading || isInUploadedStage}
          descriptor={projectDescriptor}
          handleClearDescriptor={handleClearProjectDescriptor}
          handleSetDescriptor={setProjectDescriptor}
        >
          <div className="items-top flex space-x-2">
            <Checkbox
              id="use-descriptor-content"
              onCheckedChange={(checkState) => {
                // console.log(`check::`, checkState);
                setUseDescriptorContent(Boolean(checkState));
              }}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="use-descriptor-content"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Use Descriptor Content for File
              </label>
            </div>
          </div>
        </ContentDescriptorInput>
      )}
      {!showSuccessVisual && !noInputFields && (
        <ContentPartnerInput
          isDisabled={isUploading || isInUploadedStage}
          projectPartner={projectPartner}
          handleClearPartner={handleClearProjectPartner}
          handleSetPartner={setProjectPartner}
        />
      )}
      {!showSuccessVisual && !noInputFields && (
        <ContentNamespaceInput
          isDisabled={isUploading || isInUploadedStage}
          projectNamespace={projectNamespace}
          handleClearNamespace={handleClearNamespace}
          handleSetProjectNamespace={setProjectNamespace}
        />
      )}
      <div className={cn('flex items-center justify-end gap-2')}>
        {/* Post-Upload Action Buttons */}
        {showSuccessVisual && (
          <SuccessCTAButtons
            disabled={isUploading}
            handleReset={handleResetForm}
          />
        )}
        {/* Pre-Upload Action Buttons */}
        {hasFilesAttached && !showSuccessVisual && (
          <Button
            type="button"
            disabled={isUploading}
            variant="ghost"
            onClick={handleResetForm}
            className={cn({
              'brightness-50 hover:brightness-100': !showSuccessVisual,
            })}
          >
            Start Over
          </Button>
        )}
        {(isInAttachedStage || !areAttachedAndParsedFilesEqual) && (
          <Button
            type="button"
            // form="file-upload-form"
            disabled={disableUploadBtn}
            className="flex gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              formRef.current?.requestSubmit();
            }}
          >
            {isUploading ? (
              <>
                <IconSpinner className="animate-spin" />
                Parsing...
              </>
            ) : (
              <span className="flex gap-1.5">
                {hasFilesAttached ? 'Parse' : 'Attach Files'}
                {hasFilesAttached && (
                  <Badge
                    variant="secondary"
                    className="rounded- px-1.5 leading-none"
                  >
                    {areAttachedAndParsedFilesEqual
                      ? numOfParsedFiles
                      : numOfDifferentFiles}
                  </Badge>
                )}
              </span>
            )}
          </Button>
        )}
        {isInParsedStage && hasParsedFiles && (
          <Button
            type="button"
            // form="file-upload-form"
            disabled={disableUploadBtn}
            className="flex gap-1.5"
            onClick={handleIngestParsedFiles}
          >
            {isUploading ? (
              <>
                <IconSpinner className="animate-spin" />
                Uploading...
              </>
            ) : (
              <span className="flex gap-1.5">
                <span>Upload</span>
                <Badge
                  variant="secondary"
                  className="rounded- px-1.5 leading-none"
                >
                  {parsedFiles.length}
                </Badge>
              </span>
            )}
          </Button>
        )}
      </div>
      {/* Preview a File's Parsed Content */}
      {parsedFileToPreview && (
        <PreviewParsedFileDialog
          open
          file={parsedFileToPreview}
          handleOnClose={handleRemoveParsedFileToPreview}
        />
      )}
    </div>
  );
}
