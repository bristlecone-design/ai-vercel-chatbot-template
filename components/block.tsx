import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type {
  Attachment,
  ChatRequestOptions,
  CreateMessage,
  Message,
} from 'ai';
import cx from 'classnames';
import { formatDistance } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import useSWR, { useSWRConfig } from 'swr';
import {
  useCopyToClipboard,
  useDebounceCallback,
  useWindowSize,
} from 'usehooks-ts';

import type { DocSuggestion, Document, Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';

import { DiffView } from './diffview';
import { DocumentSkeleton } from './document-skeleton';
import { Editor } from './editor';
import { CopyIcon, CrossIcon, DeltaIcon, RedoIcon, UndoIcon } from './icons';
import { PreviewMessage } from './message';
import { MultimodalInput } from './multimodal-input';
import { Toolbar } from './toolbar';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { VersionFooter } from './version-footer';

export interface UIBlock {
  title: string;
  documentId: string;
  content: string;
  isVisible: boolean;
  status: 'streaming' | 'idle';
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export function Block({
  chatId,
  input,
  setInput,
  handleSubmit,
  isLoading,
  stop,
  attachments,
  setAttachments,
  append,
  block,
  setBlock,
  messages,
  setMessages,
  votes,
}: {
  chatId: string;
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  block: UIBlock;
  setBlock: Dispatch<SetStateAction<UIBlock>>;
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  votes: Array<Vote> | undefined;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions
  ) => void;
}) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const {
    data: documents,
    isLoading: isDocumentsFetching,
    mutate: mutateDocuments,
  } = useSWR<Array<Document>>(
    block && block.status !== 'streaming'
      ? `/api/document?id=${block.documentId}`
      : null,
    fetcher
  );

  const { data: suggestions } = useSWR<Array<DocSuggestion>>(
    documents && block && block.status !== 'streaming'
      ? `/api/suggestions?documentId=${block.documentId}`
      : null,
    fetcher,
    {
      dedupingInterval: 5000,
    }
  );

  const [mode, setMode] = useState<'edit' | 'diff'>('edit');
  const [document, setDocument] = useState<Document | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  useEffect(() => {
    if (documents && documents.length > 0) {
      const mostRecentDocument = documents.at(-1);

      if (mostRecentDocument) {
        setDocument(mostRecentDocument);
        setCurrentVersionIndex(documents.length - 1);
        setBlock((currentBlock) => ({
          ...currentBlock,
          content: mostRecentDocument.content ?? '',
        }));
      }
    }
  }, [documents, setBlock]);

  useEffect(() => {
    mutateDocuments();
  }, [block.status, mutateDocuments]);

  const { mutate } = useSWRConfig();
  const [isContentDirty, setIsContentDirty] = useState(false);

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!block) return;

      mutate<Array<Document>>(
        `/api/document?id=${block.documentId}`,
        async (currentDocuments) => {
          if (!currentDocuments) return undefined;

          const currentDocument = currentDocuments.at(-1);

          if (!currentDocument || !currentDocument.content) {
            setIsContentDirty(false);
            return currentDocuments;
          }

          if (currentDocument.content !== updatedContent) {
            await fetch(`/api/document?id=${block.documentId}`, {
              method: 'POST',
              body: JSON.stringify({
                title: block.title,
                content: updatedContent,
              }),
            });

            setIsContentDirty(false);

            const newDocument = {
              ...currentDocument,
              content: updatedContent,
              createdAt: new Date(),
            };

            return [...currentDocuments, newDocument];
          }
          return currentDocuments;
        },
        { revalidate: false }
      );
    },
    [block, mutate]
  );

  const debouncedHandleContentChange = useDebounceCallback(
    handleContentChange,
    2000
  );

  const saveContent = useCallback(
    (updatedContent: string, debounce: boolean) => {
      if (document && updatedContent !== document.content) {
        setIsContentDirty(true);

        if (debounce) {
          debouncedHandleContentChange(updatedContent);
        } else {
          handleContentChange(updatedContent);
        }
      }
    },
    [document, debouncedHandleContentChange, handleContentChange]
  );

  function getDocumentContentById(index: number) {
    if (!documents) return '';
    if (!documents[index]) return '';
    return documents[index].content ?? '';
  }

  const handleVersionChange = (type: 'next' | 'prev' | 'toggle' | 'latest') => {
    if (!documents) return;

    if (type === 'latest') {
      setCurrentVersionIndex(documents.length - 1);
      setMode('edit');
    }

    if (type === 'toggle') {
      setMode((mode) => (mode === 'edit' ? 'diff' : 'edit'));
    }

    if (type === 'prev') {
      if (currentVersionIndex > 0) {
        setCurrentVersionIndex((index) => index - 1);
      }
    } else if (type === 'next') {
      if (currentVersionIndex < documents.length - 1) {
        setCurrentVersionIndex((index) => index + 1);
      }
    }
  };

  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  /*
   * NOTE: if there are no documents, or if
   * the documents are being fetched, then
   * we mark it as the current version.
   */

  const isCurrentVersion =
    documents && documents.length > 0
      ? currentVersionIndex === documents.length - 1
      : true;

  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

  const [_, copyToClipboard] = useCopyToClipboard();

  return (
    <motion.div
      className="fixed left-0 top-0 z-50 flex h-dvh w-dvw flex-row bg-muted"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { delay: 0.4 } }}
    >
      {!isMobile && (
        <motion.div
          className="relative h-dvh w-[400px] shrink-0 bg-muted dark:bg-background"
          initial={{ opacity: 0, x: 10, scale: 1 }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
              delay: 0.2,
              type: 'spring',
              stiffness: 200,
              damping: 30,
            },
          }}
          exit={{
            opacity: 0,
            x: 0,
            scale: 0.95,
            transition: { delay: 0 },
          }}
        >
          <AnimatePresence>
            {!isCurrentVersion && (
              <motion.div
                className="absolute left-0 top-0 z-50 h-dvh w-[400px] bg-zinc-900/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>

          <div className="flex h-full flex-col items-center justify-between gap-4">
            <div
              ref={messagesContainerRef}
              className="flex h-full flex-col items-center gap-4 overflow-y-scroll px-4 pt-20"
            >
              {messages.map((message, index) => (
                <PreviewMessage
                  chatId={chatId}
                  key={message.id}
                  message={message}
                  block={block}
                  setBlock={setBlock}
                  isLoading={isLoading && index === messages.length - 1}
                  vote={
                    votes
                      ? votes.find((vote) => vote.messageId === message.id)
                      : undefined
                  }
                />
              ))}

              <div
                ref={messagesEndRef}
                className="min-h-[24px] min-w-[24px] shrink-0"
              />
            </div>

            <form className="relative flex w-full flex-row items-end gap-2 px-4 pb-4">
              <MultimodalInput
                chatId={chatId}
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                append={append}
                className="bg-background dark:bg-muted"
                setMessages={setMessages}
              />
            </form>
          </div>
        </motion.div>
      )}

      <motion.div
        className="fixed flex h-dvh flex-col overflow-y-scroll bg-background shadow-xl dark:bg-muted"
        initial={
          isMobile
            ? {
                opacity: 0,
                x: 0,
                y: 0,
                width: windowWidth,
                height: windowHeight,
                borderRadius: 50,
              }
            : {
                opacity: 0,
                x: block.boundingBox.left,
                y: block.boundingBox.top,
                height: block.boundingBox.height,
                width: block.boundingBox.width,
                borderRadius: 50,
              }
        }
        animate={
          isMobile
            ? {
                opacity: 1,
                x: 0,
                y: 0,
                width: windowWidth,
                height: '100dvh',
                borderRadius: 0,
                transition: {
                  delay: 0,
                  type: 'spring',
                  stiffness: 200,
                  damping: 30,
                },
              }
            : {
                opacity: 1,
                x: 400,
                y: 0,
                height: windowHeight,
                width: windowWidth ? windowWidth - 400 : 'calc(100dvw-400px)',
                borderRadius: 0,
                transition: {
                  delay: 0,
                  type: 'spring',
                  stiffness: 200,
                  damping: 30,
                },
              }
        }
        exit={{
          opacity: 0,
          scale: 0.5,
          transition: {
            delay: 0.1,
            type: 'spring',
            stiffness: 600,
            damping: 30,
          },
        }}
      >
        <div className="flex flex-row items-start justify-between p-2">
          <div className="flex flex-row items-start gap-4">
            <Button
              variant="outline"
              className="h-fit p-2 dark:hover:bg-zinc-700"
              onClick={() => {
                setBlock((currentBlock) => ({
                  ...currentBlock,
                  isVisible: false,
                }));
              }}
            >
              <CrossIcon size={18} />
            </Button>

            <div className="flex flex-col">
              <div className="font-medium">
                {document?.title ?? block.title}
              </div>

              {isContentDirty ? (
                <div className="text-sm text-muted-foreground">
                  Saving changes...
                </div>
              ) : document ? (
                <div className="text-sm text-muted-foreground">
                  {`Updated ${formatDistance(
                    new Date(document.createdAt),
                    new Date(),
                    {
                      addSuffix: true,
                    }
                  )}`}
                </div>
              ) : (
                <div className="mt-2 h-3 w-32 animate-pulse rounded-md bg-muted-foreground/20" />
              )}
            </div>
          </div>

          <div className="flex flex-row gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="h-fit p-2 dark:hover:bg-zinc-700"
                  onClick={() => {
                    copyToClipboard(block.content);
                    toast.success('Copied to clipboard!');
                  }}
                  disabled={block.status === 'streaming'}
                >
                  <CopyIcon size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy to clipboard</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="!pointer-events-auto h-fit p-2 dark:hover:bg-zinc-700"
                  onClick={() => {
                    handleVersionChange('prev');
                  }}
                  disabled={
                    currentVersionIndex === 0 || block.status === 'streaming'
                  }
                >
                  <UndoIcon size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Previous version</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="!pointer-events-auto h-fit p-2 dark:hover:bg-zinc-700"
                  onClick={() => {
                    handleVersionChange('next');
                  }}
                  disabled={isCurrentVersion || block.status === 'streaming'}
                >
                  <RedoIcon size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Next version</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className={cx(
                    '!pointer-events-auto h-fit p-2 dark:hover:bg-zinc-700',
                    {
                      'bg-muted': mode === 'diff',
                    }
                  )}
                  onClick={() => {
                    handleVersionChange('toggle');
                  }}
                  disabled={
                    block.status === 'streaming' || currentVersionIndex === 0
                  }
                >
                  <DeltaIcon size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View changes</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="prose h-full !max-w-full items-center overflow-y-scroll bg-background px-4 py-8 pb-40 dark:prose-invert dark:bg-muted md:p-20">
          <div className="mx-auto flex max-w-[600px] flex-row">
            {isDocumentsFetching && !block.content ? (
              <DocumentSkeleton />
            ) : mode === 'edit' ? (
              <Editor
                content={
                  isCurrentVersion
                    ? block.content
                    : getDocumentContentById(currentVersionIndex)
                }
                isCurrentVersion={isCurrentVersion}
                currentVersionIndex={currentVersionIndex}
                status={block.status}
                saveContent={saveContent}
                suggestions={isCurrentVersion ? (suggestions ?? []) : []}
              />
            ) : (
              <DiffView
                oldContent={getDocumentContentById(currentVersionIndex - 1)}
                newContent={getDocumentContentById(currentVersionIndex)}
              />
            )}

            {suggestions ? (
              <div className="h-dvh w-12 shrink-0 md:hidden" />
            ) : null}

            <AnimatePresence>
              {isCurrentVersion && (
                <Toolbar
                  isToolbarVisible={isToolbarVisible}
                  setIsToolbarVisible={setIsToolbarVisible}
                  append={append}
                  isLoading={isLoading}
                  stop={stop}
                  setMessages={setMessages}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {!isCurrentVersion && (
            <VersionFooter
              block={block}
              currentVersionIndex={currentVersionIndex}
              documents={documents}
              handleVersionChange={handleVersionChange}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
