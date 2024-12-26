'use client';

import type React from 'react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useAppAudio } from '@/state/app-audio-provider';
import type {
  Attachment,
  ChatRequestOptions,
  CreateMessage,
  Message,
} from 'ai';
import cx from 'classnames';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { cn, sanitizeUIMessages } from '@/lib/utils';

import { AudioCountdownDialog } from './audio/audio-countdown-dialog';
import {
  AudioManagerPauseResumeBtn,
  AudioManagerRecordBtn,
  AudioManagerVisualizer,
} from './audio/audio-manager';
import { AudioRecordingTime } from './audio/audio-recorder';
import { DiscoveryUserSuggestions } from './discovery/discovery-suggestions';
import {
  MultimodalAttachFilesBtn,
  MultimodalClearInputBtn,
  MultimodalStopBtn,
  MultimodalSubmitBtn,
} from './multimodal-input-btns';
import { PreviewAttachment } from './preview-attachment';
import { Textarea } from './ui/textarea';

const suggestedActions = [
  {
    title: 'What is the weather',
    label: 'in San Francisco?',
    action: 'What is the weather in San Francisco?',
  },
  {
    title: 'Help me draft an essay',
    label: 'about Silicon Valley',
    action: 'Help me draft a short essay about Silicon Valley',
  },
];

export type MultimodalInputProps = {
  chatId: string;
  input: string;
  disabled?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  uploadFile: (file: File) => Promise<Attachment | undefined>;
  removeFile: (
    attachment: Attachment
  ) => Promise<{ success: boolean; url: string } | undefined>;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  removeAttachment: (attachment: Attachment) => void;
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
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
  className?: string;
};

export function MultimodalInput({
  chatId,
  input,
  setInput,
  isLoading,
  stop,
  attachments,
  setAttachments,
  removeAttachment: removeAttachmentProp,
  uploadFile,
  removeFile,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  disabled = false,
  textareaRef: textareaRefProp,
}: MultimodalInputProps) {
  const textareaRef = textareaRefProp || useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  const {
    // data: audioData,
    // isAudioLoading,
    isAudioPaused,
    isAudioRecording,
    isAudioCountdown,
    isAudioTranscribing,
    // cancelAll: handleClearingAudio,
  } = useAppAudio();

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    ''
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setLocalStorageInput('');

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments]
  );

  const handleRemovingAttachment = useCallback(
    async (attachment: Attachment) => {
      if (attachment.url) {
        const res = await removeFile(attachment);

        if (res?.success && typeof removeAttachmentProp === 'function') {
          removeAttachmentProp(attachment);
        }
      }
    },
    [attachments, setAttachments]
  );

  const handleClearingInput = () => {
    setInput('');
    setLocalStorageInput('');
    setAttachments([]);
  };

  const hasInputValue = input.length > 0 || localStorageInput.length > 0;

  const isClearInputDisabled =
    !hasInputValue || isLoading || isAudioTranscribing || disabled;

  return (
    <div className="relative flex w-full flex-col gap-4">
      {/* Suggestions */}
      {!isAudioRecording &&
        !isAudioCountdown &&
        !isAudioTranscribing &&
        !isAudioPaused &&
        messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <DiscoveryUserSuggestions
            numOfSkeletons={4}
            onItemSelect={async (item) => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              append({
                role: 'user',
                content: item.suggestion,
              });
            }}
          />
        )}

      {/* Audio Visuals  */}
      {(isAudioRecording ||
        isAudioTranscribing ||
        isAudioPaused ||
        isAudioCountdown) && (
        <div className="flex w-full justify-center py-2">
          <AudioManagerVisualizer
            className="h-14 min-w-[initial] max-w-[68%] rounded-3xl"
            barWidth={1}
          />
        </div>
      )}

      {/* Attachments */}
      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row items-end gap-2">
          {attachments.map((attachment) => (
            <PreviewAttachment
              allowRemove
              key={attachment.url}
              attachment={attachment}
              handleOnRemove={handleRemovingAttachment}
              isUploading={isAudioTranscribing}
            />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <input
        type="file"
        className="pointer-events-none fixed -left-4 -top-4 size-0.5 opacity-0"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      <Textarea
        ref={textareaRef}
        placeholder={
          isAudioTranscribing
            ? 'Transcribing your audio...'
            : isAudioRecording
              ? 'Recording audio...'
              : isAudioPaused
                ? 'Audio recording paused...'
                : isAudioCountdown
                  ? 'Starting audio recording...'
                  : 'What would you like to discover, share or ask?'
        }
        value={input}
        onChange={handleInput}
        disabled={disabled || isLoading || isAudioTranscribing}
        className={cx(
          'max-h-[calc(75dvh)] min-h-[24px] resize-none overflow-auto rounded-xl bg-muted text-base',
          className
        )}
        rows={3}
        autoFocus
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();

            if (isLoading) {
              toast.error('Please wait for the model to finish its response!');
            } else {
              submitForm();
            }
          }
        }}
      />

      <div
        className={cn(
          'absolute bottom-2 right-2 flex w-fit items-center justify-end gap-2 shadow-sm backdrop-blur-md',
          {
            'rounded-2xl bg-background/20':
              !isAudioRecording && !isAudioPaused && !isAudioCountdown,
            'rounded-full px-3':
              isAudioRecording || isAudioPaused || isAudioCountdown,
          }
        )}
      >
        {/* Audio Recording Time */}
        {(isAudioRecording || isAudioPaused || isAudioCountdown) && (
          <AudioRecordingTime
            variant="default"
            className="bg-primary/50 text-xs font-semibold"
          />
        )}

        {/* Audio Pause/Resume */}
        <AudioManagerPauseResumeBtn disabled={disabled} />

        {/* Audio Recording */}
        <AudioManagerRecordBtn disabled={disabled} />

        {/* Audio Modal Countdown */}
        <AudioCountdownDialog />

        {/* Attachments */}
        <MultimodalAttachFilesBtn
          variant="outline"
          handleOnClick={() => {
            fileInputRef.current?.click();
          }}
          disabled={
            disabled ||
            isLoading ||
            isAudioRecording ||
            isAudioTranscribing ||
            isAudioCountdown
          }
          dim={isAudioRecording || isAudioPaused || isAudioCountdown}
          className=""
        />

        {/* Clearing Input */}
        <MultimodalClearInputBtn
          handleOnClick={handleClearingInput}
          dim={isAudioRecording || isAudioPaused || isAudioCountdown}
          disabled={isClearInputDisabled}
        />

        {/* Submit/Stop */}
        {isLoading ? (
          <MultimodalStopBtn
            handleOnClick={() => {
              stop();
              setMessages((messages) => sanitizeUIMessages(messages));
            }}
            disabled={disabled}
            dim={isAudioRecording || isAudioPaused || isAudioCountdown}
            className=""
          />
        ) : (
          <MultimodalSubmitBtn
            handleOnSubmit={() => {
              submitForm();
            }}
            disabled={
              input.length === 0 ||
              uploadQueue.length > 0 ||
              isAudioTranscribing ||
              isAudioCountdown
            }
            dim={isAudioRecording || isAudioPaused || isAudioCountdown}
            className=""
          />
        )}
      </div>
    </div>
  );
}
