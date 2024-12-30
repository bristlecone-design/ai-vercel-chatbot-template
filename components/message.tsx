'use client';

import React, { type Dispatch, type SetStateAction } from 'react';
import { ExperienceAttachmentGalleryDialog } from '@/features/experiences/posts/experience-attachment-gallery-dialog';
import { motion } from 'framer-motion';

import type { Vote } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

import type { UIBlock } from './block';
import { ReactMarkdownExtended } from './content/md/markdown';
import { DocumentToolCall, DocumentToolResult } from './document';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { IconAI } from './ui/icons';
import { Weather } from './weather';

import type { ChatMessage } from '@/types/chat-msgs';

export const PreviewMessage = ({
  chatId,
  message,
  block,
  setBlock,
  vote,
  isLoading,
}: {
  chatId: string;
  message: ChatMessage;
  block: UIBlock;
  setBlock: Dispatch<SetStateAction<UIBlock>>;
  vote: Vote | undefined;
  isLoading: boolean;
}) => {
  const [showGallery, setShowGallery] = React.useState(false);
  const [gallerySelectedIndex, setGallerySelectedIndex] = React.useState(0);

  const attachments = message.experimental_attachments || [];

  return (
    <motion.div
      className="group/message mx-auto w-full max-w-3xl px-4"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={message.role}
    >
      <div
        className={cn(
          'flex w-full gap-4 rounded-xl group-data-[role=user]/message:ml-auto group-data-[role=user]/message:w-fit group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:bg-tertiary/70 group-data-[role=user]/message:px-3 group-data-[role=user]/message:py-2 group-data-[role=user]/message:text-muted-foreground',
          'group-data-[role=user]/message:backdrop-blur-sm',
          'group-data-[role=assistant]/message:bg-muted/40',
          'group-data-[role=assistant]/message:backdrop-blur-md',
          'group-data-[role=assistant]/message:px-3',
          'group-data-[role=assistant]/message:py-2'
        )}
      >
        {message.role === 'assistant' && (
          <div
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-border backdrop-blur-sm'
            )}
          >
            <IconAI
              className={cn('', {
                'animate-spin': isLoading,
              })}
            />
          </div>
        )}

        <div className="flex w-full flex-col gap-2">
          {message.content && (
            <div className="flex flex-col gap-4">
              <ReactMarkdownExtended>
                {message.content as string}
              </ReactMarkdownExtended>
            </div>
          )}

          {message.toolInvocations && message.toolInvocations.length > 0 && (
            <div className="flex flex-col gap-4">
              {message.toolInvocations.map((toolInvocation) => {
                const { toolName, toolCallId, state, args } = toolInvocation;

                if (state === 'result') {
                  const { result } = toolInvocation;

                  return (
                    <div key={toolCallId}>
                      {toolName === 'getWeather' ? (
                        <Weather weatherAtLocation={result} />
                      ) : toolName === 'createDocument' ? (
                        <DocumentToolResult
                          type="create"
                          result={result}
                          block={block}
                          setBlock={setBlock}
                        />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolResult
                          type="update"
                          result={result}
                          block={block}
                          setBlock={setBlock}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolResult
                          type="request-suggestions"
                          result={result}
                          block={block}
                          setBlock={setBlock}
                        />
                      ) : (
                        <pre>{JSON.stringify(result, null, 2)}</pre>
                      )}
                    </div>
                  );
                }
                return (
                  <div
                    key={toolCallId}
                    className={cn({
                      skeleton: ['getWeather'].includes(toolName),
                    })}
                  >
                    {toolName === 'getWeather' ? (
                      <Weather />
                    ) : toolName === 'createDocument' ? (
                      <DocumentToolCall
                        type="create"
                        args={args}
                        setBlock={setBlock}
                      />
                    ) : toolName === 'updateDocument' ? (
                      <DocumentToolCall
                        type="update"
                        args={args}
                        setBlock={setBlock}
                      />
                    ) : toolName === 'requestSuggestions' ? (
                      <DocumentToolCall
                        type="request-suggestions"
                        args={args}
                        setBlock={setBlock}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="flex flex-row gap-2">
              {attachments.map((attachment, index) => (
                <PreviewAttachment
                  key={attachment.url}
                  attachment={attachment}
                  handleOnEnlarge={() => {
                    setGallerySelectedIndex(index);
                    setShowGallery(true);
                  }}
                />
              ))}

              {showGallery && (
                <ExperienceAttachmentGalleryDialog
                  open={showGallery}
                  handleOnClose={() => setShowGallery(false)}
                  attachments={attachments}
                />
              )}
            </div>
          )}

          <MessageActions
            key={`action-${message.id}`}
            chatId={chatId}
            message={message}
            vote={vote}
            isLoading={isLoading}
          />
        </div>
      </div>
    </motion.div>
  );
};

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      className="group/message mx-auto w-full max-w-3xl px-4"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cn(
          'flex w-full gap-4 rounded-xl group-data-[role=user]/message:ml-auto group-data-[role=user]/message:w-fit group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:px-3 group-data-[role=user]/message:py-2',
          {
            'group-data-[role=user]/message:bg-muted': true,
          }
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-border">
          <IconAI className="animate-spin" />
        </div>

        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Thinking...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
