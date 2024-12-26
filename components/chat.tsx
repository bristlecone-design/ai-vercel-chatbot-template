'use client';

import { useRef, useState } from 'react';
import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { AnimatePresence } from 'framer-motion';
import useSWR, { useSWRConfig } from 'swr';
import { useWindowSize } from 'usehooks-ts';

import type { Vote } from '@/lib/db/schema';
import {
  removeFileFetch,
  uploadFileFetch,
} from '@/lib/storage/vercel-blob-fetch';
import { fetcher } from '@/lib/utils';
import { ChatHeader } from '@/components/header-chat';
import { PreviewMessage, ThinkingMessage } from '@/components/message';
import { useScrollToBottom } from '@/components/use-scroll-to-bottom';

import { WithAudioProvider } from './audio/audio-manager';
import { Block, type UIBlock } from './block';
import { BlockStreamHandler } from './block-stream-handler';
import { MultimodalInput } from './multimodal-input';
import { Overview } from './overview';

export function Chat({
  id,
  initialMessages,
  selectedModelId,
  disabled = false,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
  disabled?: boolean;
}) {
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
    data: streamingData,
  } = useChat({
    body: { id, modelId: selectedModelId },
    initialMessages,
    onFinish: () => {
      mutate('/api/history');
    },
  });

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

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const [isAudioRecording, setIsAudioRecording] = useState(false);

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  const handleToggleAudioRecording = (nextState: boolean | undefined) => {
    if (typeof nextState === 'boolean') {
      setIsAudioRecording(nextState);
      return;
    }

    setIsAudioRecording((prev) => !prev);
  };

  const handleRemovingAttachment = (attachment: Attachment) => {
    console.log('attachment to remove', attachment);
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
    <>
      <div className="flex h-dvh min-w-0 flex-col bg-background">
        <ChatHeader selectedModelId={selectedModelId} />
        <div
          ref={messagesContainerRef}
          className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-scroll pt-4"
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
        <form className="mx-auto flex w-full gap-2 px-4 pb-4 md:max-w-3xl md:pb-6">
          <WithAudioProvider
            withCountdown
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

      <BlockStreamHandler streamingData={streamingData} setBlock={setBlock} />
    </>
  );
}
