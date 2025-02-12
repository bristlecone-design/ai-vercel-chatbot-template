'use client';

import { useRef, useState, type DragEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppState } from '@/state/app-state';
import { useChat } from '@ai-sdk/react';
import { createIdGenerator, type ChatRequestOptions, type Message } from 'ai';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import useSWR, { useSWRConfig } from 'swr';
import { useWindowSize } from 'usehooks-ts';

import type { Vote } from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/errors';
import fetcher from '@/lib/fetcher';
import {
  removeFileFetch,
  uploadFileFetch,
} from '@/lib/storage/vercel-blob-fetch';
import { cn } from '@/lib/utils';
import { ChatHeader } from '@/components/header-chat';
import { PreviewMessage, ThinkingMessage } from '@/components/message';
import { useScrollToBottom } from '@/components/use-scroll-to-bottom';

import { WithAudioProvider } from './audio/audio-manager';
import { Block, type UIBlock } from './block';
import { MultimodalInput } from './multimodal-input';
import { Overview } from './overview';
import { IconAttachFiles } from './ui/icons';

import type { MediaAttachment } from '@/types/media';

export interface ChatProps {
  id: string;
  initialMessages: Message[];
  selectedModelId: string;
  disabled?: boolean;
  msgsContainerClassName?: string;
  notAllowedToDiscover?: boolean;
  className?: string;
}

export function Chat({
  id,
  initialMessages,
  selectedModelId,
  disabled = false,
  msgsContainerClassName,
  notAllowedToDiscover: notAllowedToDiscoverProp = false,
  className,
}: ChatProps) {
  const searchParams = useSearchParams();
  const notInBetaQueryParam = searchParams.get('notInBeta') === 'true';

  const { isInPrivateBeta } = useAppState();

  const [showNotInBetaDialog, setShowNotInBetaDialog] = useState(
    notAllowedToDiscoverProp
  );

  const derivedAllowedToDiscover = isInPrivateBeta || !notInBetaQueryParam;

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextAreaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const { mutate } = useSWRConfig();

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
    data: streamingData,
  } = useChat({
    api: `/api/chat`,
    body: {
      id,
      modelId: selectedModelId,
      discoverEnabled: derivedAllowedToDiscover,
    },
    initialMessages,

    /**
     * Only send the last (current) user message to the server
     *
     * https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat#experimental_prepare-request-body
     */
    experimental_prepareRequestBody({
      messages,
      id: generatedId,
      requestBody,
    }) {
      // console.log(
      //   'requestBody and generatedId in experimental_prepareRequestBody',
      //   { requestBody, generatedId }
      // );
      const numOfMessages = messages.length;
      return {
        numOfMessages,
        messages: [messages[numOfMessages - 1]],
        id: id || generatedId,
        modelId: selectedModelId,
        discoverEnabled: derivedAllowedToDiscover,
        ...requestBody,
      };
    },

    // ID format for client-side messages:
    // https://sdk.vercel.ai/docs/reference/ai-sdk-core/create-id-generator
    generateId: createIdGenerator({
      prefix: 'msgc',
      size: 16,
    }),

    // https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat#on-error
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },

    // https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat#on-tool-call
    onToolCall({ toolCall }) {
      if (toolCall.toolName === 'discover') {
        toast.info('Discovering...');
      }
    },

    // https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat#on-finish
    onFinish: () => {
      mutate('/api/history');
    },
  });
  // if (messages.length > 0) {
  //   console.log('chat messages and streaming data', {
  //     messages,
  //     streamingData,
  //   });
  // }

  const { width: windowWidth = 1920, height: windowHeight = 1080 } =
    useWindowSize();

  const [block, setBlock] = useState<UIBlock>({
    documentId: 'init',
    content: '',
    title: '',
    status: 'idle',
    isVisible: false,
    boundingBox: {
      top: windowHeight / 4,
      left: windowWidth / 4,
      width: 250,
      height: 50,
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher
  );

  const {
    isVisible,
    isAtBottom,
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
  } = useScrollToBottom<HTMLDivElement>();

  const [isAudioRecording, setIsAudioRecording] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const [attachments, setAttachments] = useState<Array<MediaAttachment>>([]);

  const isUploading = uploadQueue.length > 0;

  // Leverages reload to refresh the chat messages
  const handleRegenerateLastAssistantResponse = async (
    chatRequestOptions?: ChatRequestOptions
  ): Promise<string | null | undefined> => {
    return reload({
      ...(chatRequestOptions || {}),
      body: {
        regenerateResponse: true,
      },
    });
  };

  const handleToggleAudioRecording = (nextState: boolean | undefined) => {
    if (typeof nextState === 'boolean') {
      setIsAudioRecording(nextState);
      return;
    }

    setIsAudioRecording((prev) => !prev);
  };

  const handleRemovingAttachment = (attachment: MediaAttachment) => {
    setAttachments((prev) => {
      if (!prev || prev.length === 0) {
        return [];
      }

      return prev.filter((a) => a.url !== attachment.url);
    });
  };

  const handleOnAudioTranscriptionComplete = async (transcription: string) => {
    setInput(transcription);
    adjustTextAreaHeight();
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    const droppedFilesArray = Array.from(droppedFiles);
    if (droppedFilesArray.length > 0) {
      setUploadQueue(droppedFilesArray.map((file) => file.name));

      try {
        // TODO: Handle validation of file types
        const uploadPromises = droppedFilesArray.map((file) =>
          uploadFileFetch(file)
        );
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        const errMsg = getErrorMessage(error);
        const userMsg = `Error uploading dropped files: ${errMsg}`;
        console.error(userMsg);
        toast.error(userMsg);
      } finally {
        setUploadQueue([]);
      }

      // const validFiles = droppedFilesArray.filter(
      //   (file) =>
      //     file.type.startsWith('image/') || file.type.startsWith('text/')
      // );
      // if (validFiles.length === droppedFilesArray.length) {
      //   const dataTransfer = new DataTransfer();
      //   validFiles.forEach((file) => dataTransfer.items.add(file));
      //   setFiles(dataTransfer.files);
      // } else {
      //   toast.error('Only image and text files are allowed!');
      // }
      // setFiles(droppedFiles);
    }
    setIsDragging(false);
  };

  // const handleOnAudioRecordingComplete = async (
  //   blob: Blob,
  //   fileName?: string
  // ) => {
  //   try {
  //     const uploadedAttachment = await uploadFileFetch(blob);
  //     console.log('uploadedAttachment', uploadedAttachment);

  //     if (uploadedAttachment) {
  //       setAttachments((prev) => [
  //         ...prev,
  //         {
  //           ...uploadedAttachment,
  //           name: fileName || 'Audio Message',
  //           contentType: blob.type,
  //         },
  //       ]);
  //     }
  //   } catch (error) {
  //     toast.error('Failed to upload file, please try again!');
  //   }
  // };

  return (
    <div
      className=""
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag-and-Drop UI */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="pointer-events-none fixed z-10 flex h-dvh w-full flex-row items-center justify-center gap-1 bg-background/75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: [1, 1.2, 1.5, 2] }}
          >
            <div className="flex size-[82%] max-w-md flex-col items-center justify-center gap-2 rounded-lg border-4 border-dashed border-border p-4 backdrop-blur-sm sm:min-w-164 md:gap-4">
              <IconAttachFiles className="text-foreground/50 md:size-10" />
              <h3 className="text-center text-lg leading-normal md:text-2xl">
                Drag and Drop
                <br />
                Files Here
              </h3>
              {isUploading && (
                <div className="flex flex-col gap-2 text-center text-foreground/50">
                  <p className="">Attaching...</p>
                  <ul className="list-none">
                    {uploadQueue.map((fileName) => (
                      <li key={fileName} className="">
                        {fileName}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Main Chat UI for User */}
      <div className={cn('flex h-dvh w-full min-w-0 flex-col', className)}>
        <ChatHeader selectedModelId={selectedModelId} />
        <div
          className={cn(
            'flex w-full grow flex-col items-center gap-2 self-center p-2 py-10 transition-transform duration-200 md:max-w-3xl',
            {
              'scale-95': isDragging,
            }
            // msgsContainerClassName
          )}
        >
          <div
            ref={messagesContainerRef}
            className={cn(
              'flex min-w-0 flex-1 flex-col gap-6',
              'size-full',
              msgsContainerClassName
            )}
          >
            {messages.length === 0 && (
              <Overview
                avatarNoProfileLink={isAudioRecording}
                avatarPing={isAudioRecording}
              />
            )}

            {messages.map((message, index) => (
              <PreviewMessage
                key={message.id}
                chatId={id}
                message={message}
                block={block}
                setBlock={setBlock}
                reload={handleRegenerateLastAssistantResponse}
                isLoading={isLoading && messages.length - 1 === index}
                vote={
                  votes
                    ? votes.find((vote) => vote.messageId === message.id)
                    : undefined
                }
              />
            ))}

            {isLoading &&
              messages.length > 0 &&
              messages[messages.length - 1].role === 'user' && (
                <ThinkingMessage />
              )}

            <div
              ref={messagesEndRef}
              className="min-h-[24px] min-w-[24px] shrink-0"
            />
          </div>
          <form className="mx-auto flex w-full gap-2 px-2 sm:px-0">
            <WithAudioProvider
              // withCountdown
              transcribeOnComplete
              // handleOnRecordComplete={handleOnAudioRecordingComplete}
              handleOnTranscriptionComplete={handleOnAudioTranscriptionComplete}
              handleOnRecordingStart={() => handleToggleAudioRecording(true)}
              handleOnRecordingEnd={() => handleToggleAudioRecording(false)}
            >
              <MultimodalInput
                chatId={id}
                input={input}
                disabled={disabled}
                textareaRef={textareaRef}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                stop={stop}
                uploadQueue={uploadQueue}
                setUploadQueue={setUploadQueue}
                attachments={attachments}
                setAttachments={setAttachments}
                removeAttachment={handleRemovingAttachment}
                uploadFile={uploadFileFetch}
                removeFile={removeFileFetch}
                messages={messages}
                setMessages={setMessages}
                append={append}
              />
            </WithAudioProvider>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {block?.isVisible && (
          <Block
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            append={append}
            block={block}
            setBlock={setBlock}
            messages={messages}
            setMessages={setMessages}
            votes={votes}
          />
        )}
      </AnimatePresence>

      {/* <BlockStreamHandler streamingData={streamingData} setBlock={setBlock} /> */}

      {/* {showNotInBetaDialog && (
        <DialogDiscoverSplashScreen lightOverlay={false} />
      )} */}
    </div>
  );
}
