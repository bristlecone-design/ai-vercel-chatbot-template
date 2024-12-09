'use client';

import * as React from 'react';
import { toast } from 'sonner';

import type { CrawledPage } from '@/lib/pinecone-langchain/metadata';
import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  type DialogRootProps,
} from '@/components/ui/dialog';

import { IconCheck, IconCopy } from '../../ui/icons';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '../../ui/resizable';
import type { FileInBase64, ParsedUrlItem } from '../files/file-uploader-types';
import { ReactMarkdownExtended } from '../md/markdown';
import { UrlPreviewOverview } from './url-form-processor';

export interface PreviewParsedUrlBaseViewProps {
  page: CrawledPage;
  className?: string;
}

export interface PreviewParsedUrlSingleViewProps
  extends PreviewParsedUrlBaseViewProps {
  withCopyButton?: boolean;
  withContainer?: boolean;
  content?: string;
}

export function PreviewParsedUrlSingleView({
  page,
  className,
  withContainer = true,
  withCopyButton = true,
  content: contentProp,
}: PreviewParsedUrlSingleViewProps) {
  const { content } = page;
  const contentToRender = contentProp || content;

  // Handle copying the content to the clipboard
  const { isCopied: isMessageCopied, copyToClipboard: copyMessageToClipboard } =
    useCopyToClipboard({ timeout: 2000 });

  const onContentCopy = () => {
    if (isMessageCopied) return;
    copyMessageToClipboard(contentToRender);
    toast.message(
      <div data-content>
        <div data-title>Content Copied to Clipboard</div>
        <div data-description className="group-[.toast]:text-muted-foreground">
          {contentToRender.slice(0, 42)}...
        </div>
      </div>
    );
  };

  const copyBtn = withCopyButton ? (
    <Button
      variant="secondary"
      size="icon"
      onClick={onContentCopy}
      className="absolute right-1.5 top-1.5 size-7 rounded-full md:size-8"
    >
      {isMessageCopied ? <IconCheck /> : <IconCopy />}
      <span className="sr-only">Copy content</span>
    </Button>
  ) : null;

  return withContainer ? (
    <div className={cn('relative size-full overflow-y-auto', className)}>
      {copyBtn}
      <ReactMarkdownExtended>{contentToRender}</ReactMarkdownExtended>
    </div>
  ) : (
    <>
      {copyBtn}
      <ReactMarkdownExtended>{contentToRender}</ReactMarkdownExtended>
    </>
  );
}

export interface PreviewParsedUrlContentSplitViewProps
  extends PreviewParsedUrlBaseViewProps {}

/**
 * Preview the content of a parsed URL in a split view
 *
 * @note assumes the xContent property is defined in the CrawledPage
 *
 * @note This is useful for previewing the content of a URL that has been parsed from hard-to-read format types. The split view allows for a side-by-side comparison of the original content and a transformed version of the content in Markdown.
 *
 * @param page - The parsed URL content to preview
 * @param className - The class name to apply to the containing component
 */
export function PreviewParsedUrlContentSplitView({
  page,
  className,
}: PreviewParsedUrlContentSplitViewProps) {
  const { content, xContent, title } = page;
  return (
    <div className={cn('size-full min-h-96', className)}>
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full min-h-full max-w-full rounded-lg border"
      >
        <ResizablePanel defaultSize={50} minSize={33} maxSize={50}>
          <div className="relative h-full overflow-y-auto p-4">
            <PreviewParsedUrlSingleView
              page={page}
              content={content}
              withContainer={false}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
          <ResizablePanelGroup direction="vertical">
            {title && (
              <ResizablePanel defaultSize={18} minSize={15} maxSize={20}>
                <div className="flex h-full items-center justify-center p-6">
                  <span className="font-semibold">{title}</span>
                </div>
              </ResizablePanel>
            )}
            <ResizableHandle withHandle />
            <ResizablePanel>
              <div className="relative h-full overflow-y-auto p-6">
                <PreviewParsedUrlSingleView
                  page={page}
                  content={xContent}
                  withContainer={false}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export interface PreviewParsedUrlContentProps
  extends PreviewParsedUrlBaseViewProps {}

export function PreviewParsedUrlContent({
  page,
  className,
}: PreviewParsedUrlContentProps) {
  const { content } = page;
  // console.log(`page in PreviewParsedUrlContent`, page);

  if (!content) {
    return null;
  }

  const { xContent, ...rest } = page;
  const doSplitView = Boolean(xContent && xContent !== content);

  return (
    <div className={cn('size-full', className)}>
      {!doSplitView && <PreviewParsedUrlSingleView page={page} />}
      {doSplitView && <PreviewParsedUrlContentSplitView page={page} />}
    </div>
  );
}

export interface PreviewParsedUrlDialogProps extends DialogRootProps {
  url: { item: ParsedUrlItem; preview?: FileInBase64 };
  className?: string;
  handleOnClose?: () => void;
}

export function PreviewParsedUrlDialog({
  url,
  className,
  handleOnClose,
  open,
  ...props
}: PreviewParsedUrlDialogProps) {
  const [isOpen, setIsOpen] = React.useState(open);

  const { item, preview: filePreview } = url;

  if (!item || !item.content) {
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

  // TODO: Iterate over the pages and display them in a carousel
  const { url: parseFileSource } = item;
  const firstPage = item.content[0];
  const secondPage = item.content[1];
  const numOfPages = item.content.length;
  const { content, ...rest } = firstPage;
  let useFirstPage = true;
  // If the second page has more content, use it
  if (secondPage && secondPage.content.length > firstPage.content.length) {
    useFirstPage = false;
  }
  const pageToUse = useFirstPage ? firstPage : secondPage;
  // console.log(`parsed item`, item);
  // console.log(`firstPage`, firstPage);
  // console.log(`rest of first page props`, rest);

  return (
    <Dialog {...props} open={isOpen} onOpenChange={handleOnOpenChange}>
      <DialogContent
        className={cn('max-w-4xl', className)}
        overlayProps={{
          className: cn('backdrop-blur-sm bg-background/50'),
        }}
      >
        <DialogHeader>
          <DialogTitle>Preview of {item.url.slice(0, 42)}...</DialogTitle>
          <DialogDescription>
            Overview of the URL&apos;s parsed content.
          </DialogDescription>
        </DialogHeader>
        <div className="relative max-h-[60lvh] min-h-[20lvh] space-y-1 overflow-auto rounded-md border p-4 pb-28">
          <PreviewParsedUrlContent page={pageToUse} />
          <div className="absolute bottom-0 left-0 flex h-16 w-full items-center justify-between border-t px-4 text-sm">
            Page {useFirstPage ? 1 : 2} of {numOfPages}
          </div>
        </div>
        <DialogFooter className="items-center justify-around">
          {parseFileSource && (
            <div className="flex w-auto grow items-center">
              <UrlPreviewOverview noUserActions parsedUrl={item} />
            </div>
          )}
          <Button className="flex gap-1.5" onClick={handleOnCloseAction}>
            Okay!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
