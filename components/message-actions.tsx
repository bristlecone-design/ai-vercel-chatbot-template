import type { Message } from 'ai';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { useCopyToClipboard } from 'usehooks-ts';

import type { Vote } from '@/lib/db/schema';
import { cn, getMessageIdFromAnnotations } from '@/lib/utils';

import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from './icons';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export function MessageActions({
  onlyCopy,
  chatId,
  message,
  vote,
  isLoading,
}: {
  onlyCopy?: boolean;
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();

  if (isLoading) return null;
  // if (message.role === 'user') return null;
  if (message.toolInvocations && message.toolInvocations.length > 0)
    return null;

  const isUser = message.role === 'user';

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn('flex flex-row gap-2', {
          'absolute bottom-1.5 right-1.5 hidden group-hover:block': isUser,
        })}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isUser ? 'ghost' : 'outline'}
              className={cn(
                'h-fit bg-background/50 px-2 py-1 text-muted-foreground',
                {
                  'bg-background/35': isUser,
                }
                // 'bg-transparent backdrop-blur-sm hover:bg-muted/20 hover:backdrop-blur-lg'
              )}
              onClick={async () => {
                await copyToClipboard(message.content as string);
                toast.success('Copied to clipboard!');
              }}
            >
              <CopyIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>

        {!onlyCopy && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  '!pointer-events-auto',
                  'h-fit bg-background/50 px-2 py-1 text-muted-foreground'
                  // 'bg-transparent backdrop-blur-sm hover:bg-muted/20 hover:backdrop-blur-lg'
                )}
                disabled={vote?.isUpvoted}
                onClick={async () => {
                  const messageId = getMessageIdFromAnnotations(message);

                  const upvote = fetch('/api/vote', {
                    method: 'PATCH',
                    body: JSON.stringify({
                      chatId,
                      messageId,
                      type: 'up',
                    }),
                  });

                  toast.promise(upvote, {
                    loading: 'Upvoting Response...',
                    success: () => {
                      mutate<Array<Vote>>(
                        `/api/vote?chatId=${chatId}`,
                        (currentVotes) => {
                          if (!currentVotes) return [];

                          const votesWithoutCurrent = currentVotes.filter(
                            (vote) => vote.messageId !== message.id
                          );

                          return [
                            ...votesWithoutCurrent,
                            {
                              chatId,
                              messageId: message.id,
                              isUpvoted: true,
                            },
                          ];
                        },
                        { revalidate: false }
                      );

                      return 'Upvoted Response!';
                    },
                    error: 'Failed to upvote response.',
                  });
                }}
              >
                <ThumbUpIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Upvote Response</TooltipContent>
          </Tooltip>
        )}

        {!onlyCopy && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  '!pointer-events-auto',
                  'h-fit bg-background/50 px-2 py-1 text-muted-foreground'
                  // 'bg-transparent backdrop-blur-sm hover:bg-muted/20 hover:backdrop-blur-lg'
                )}
                disabled={vote && !vote.isUpvoted}
                onClick={async () => {
                  const messageId = getMessageIdFromAnnotations(message);

                  const downvote = fetch('/api/vote', {
                    method: 'PATCH',
                    body: JSON.stringify({
                      chatId,
                      messageId,
                      type: 'down',
                    }),
                  });

                  toast.promise(downvote, {
                    loading: 'Downvoting Response...',
                    success: () => {
                      mutate<Array<Vote>>(
                        `/api/vote?chatId=${chatId}`,
                        (currentVotes) => {
                          if (!currentVotes) return [];

                          const votesWithoutCurrent = currentVotes.filter(
                            (vote) => vote.messageId !== message.id
                          );

                          return [
                            ...votesWithoutCurrent,
                            {
                              chatId,
                              messageId: message.id,
                              isUpvoted: false,
                            },
                          ];
                        },
                        { revalidate: false }
                      );

                      return 'Downvoted Response!';
                    },
                    error: 'Failed to downvote response.',
                  });
                }}
              >
                <ThumbDownIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Downvote Response</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
