'use client';

import React, { type Dispatch, type SetStateAction } from 'react';
import { ExperienceAttachmentGalleryDialog } from '@/features/experiences/posts/experience-attachment-gallery-dialog';
import { motion } from 'framer-motion';

import {
  toolsWithCustomUISchema,
  type ToolsWithCustomUI,
} from '@/lib/ai/tools/types';
import type { Vote } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

import type { UIBlock } from './block';
import { ReactMarkdownExtended } from './content/md/markdown';
import { DocumentToolCall, DocumentToolResult } from './document';
import { MessageActions, type MessageActionsProps } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { IconAI, IconWrench } from './ui/icons';
import { Weather } from './weather';

import type { ChatMessage } from '@/types/chat-msgs';

export const MessageIconAssistant = ({
  isLoading,
  className,
  isToolInvocation = false,
}: {
  isLoading: boolean;
  className?: string;
  isToolInvocation?: boolean;
}) => {
  return (
    <div
      className={cn(
        'ring-border-alt/30 mt-1.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 backdrop-blur-sm',
        className
      )}
    >
      {!isToolInvocation && (
        <IconAI
          className={cn('', {
            'animate-spin': isLoading,
          })}
        />
      )}
      {isToolInvocation && <IconWrench />}
    </div>
  );
};

export const PreviewMessage = ({
  chatId,
  message,
  block,
  setBlock,
  vote,
  isLoading,
  reload,
}: {
  chatId: string;
  message: ChatMessage;
  block: UIBlock;
  setBlock: Dispatch<SetStateAction<UIBlock>>;
  vote: Vote | undefined;
  isLoading: boolean;
  reload?: MessageActionsProps['reload'];
}) => {
  const [showGallery, setShowGallery] = React.useState(false);
  const [gallerySelectedIndex, setGallerySelectedIndex] = React.useState(0);

  const attachments = message.experimental_attachments || [];
  const toolInvocations = message.toolInvocations || [];
  const hasToolInvocations = toolInvocations.length > 0;
  const toolHasCustomUI = hasToolInvocations
    ? toolInvocations.some((toolInvocation) => {
        if (toolInvocation.state === 'result') {
          return toolsWithCustomUISchema.safeParse(toolInvocation.toolName)
            .success;
        }
        return false;
      })
    : false;

  return (
    <motion.div
      className="group/message mx-auto w-full max-w-3xl px-4"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={message.role}
    >
      <div
        className={cn(
          'flex w-full gap-4 rounded-xl group-data-[role=user]/message:ml-auto group-data-[role=user]/message:w-fit',
          // User
          'group-data-[role=user]/message:max-w-2xl',
          'group-data-[role=user]/message:bg-tertiary/70',
          'group-data-[role=user]/message:backdrop-blur-sm',
          'group-data-[role=user]/message:text-muted-foreground',
          'group-data-[role=user]/message:px-3',
          'group-data-[role=user]/message:py-2',
          // Assistant
          {
            'group-data-[role=assistant]/message:bg-muted/40': !toolHasCustomUI,
            'group-data-[role=assistant]/message:backdrop-blur-md':
              !toolHasCustomUI,
            'group-data-[role=assistant]/message:px-3': !toolHasCustomUI,
            'group-data-[role=assistant]/message:py-3': !toolHasCustomUI,
          }
        )}
      >
        {message.role === 'assistant' && !toolHasCustomUI && (
          <MessageIconAssistant
            isLoading={isLoading}
            isToolInvocation={hasToolInvocations}
            className=""
          />
        )}

        <div className="group flex w-full flex-col gap-2">
          {message.content && (
            <div className="flex flex-col gap-4">
              <ReactMarkdownExtended>
                {message.content as string}
              </ReactMarkdownExtended>
            </div>
          )}

          {toolInvocations && toolInvocations.length > 0 && (
            <div className="flex flex-col gap-4">
              {toolInvocations.map((toolInvocation) => {
                const { toolName, toolCallId, state, args } = toolInvocation;

                if (state === 'result') {
                  const { result } = toolInvocation;

                  const nameOfTool = toolName as ToolsWithCustomUI;

                  return (
                    <div key={toolCallId}>
                      {nameOfTool === 'getWeather' ? (
                        <Weather weatherAtLocation={result} />
                      ) : nameOfTool === 'createDocument' ? (
                        <DocumentToolResult
                          type="create"
                          result={result}
                          block={block}
                          setBlock={setBlock}
                        />
                      ) : nameOfTool === 'updateDocument' ? (
                        <DocumentToolResult
                          type="update"
                          result={result}
                          block={block}
                          setBlock={setBlock}
                        />
                      ) : nameOfTool === 'requestDocumentSuggestions' ? (
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

          {/* Actions User Can Take on Message */}
          <MessageActions
            key={`action-${message.id}`}
            onlyCopy={message.role === 'user'}
            chatId={chatId}
            message={message}
            vote={vote}
            isLoading={isLoading}
            reload={reload}
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
        <MessageIconAssistant isLoading={true} className="" />

        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Thinking...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
