import React from 'react';
import { togglesUsersExperienceLikeStatus } from '@/actions/experience-toggles';
import { useAppState } from '@/state/app-state';
import { toast } from 'sonner';

import { sortRawMediaForGallery } from '@/lib/media/media-utils';
import { getUsersFirstNameFromName } from '@/lib/user/user-utils';
import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Button } from '@/components/ui/button';
import { IconCheck, IconCopy, IconHeart } from '@/components/ui/icons';
import { ReactMarkdownExtended } from '@/components/content/md/markdown';
import { SimpleTextToSpeech } from '@/components/gen-ui/speech/gen-ui-text-to-speech';

import { ExperienceMedia } from '../experiences/posts/experience-media';
import { ExperiencePostMediaGallery } from '../experiences/posts/experience-post-gallery-dialog';
import { SingleExperienceEngagementToast } from '../experiences/posts/experience-toasts';
import { createUserCompletedPromptChallengePermalink } from '../experiences/utils/experience-prompt-utils';
import { getUserProfilePermalink } from '../experiences/utils/experience-utils';
import { CompletedExperienceResponseCtas } from './completed-prompt-ctas';

import type {
  ExperienceMediaModel,
  ExperienceModel,
} from '@/types/experiences';

export type CompletedPromptResponseProps = {
  expPrompt: ExperienceModel;
  className?: string;
};

export function CompletedPromptResponse({
  expPrompt,
  className,
}: CompletedPromptResponseProps) {
  const { isAuthenticated, userId } = useAppState();

  const {
    Likes = [],
    id: expId,
    content: plainContent,
    prompt: promptQuestion,
    promptId,
    authorId,
    Author,
  } = expPrompt;

  const expAuthorId = authorId || '';

  const isExpPrompt = Boolean(expPrompt.prompt && expPrompt.content);

  const initDerivedIsLiked = Likes.some((like) => like.userId === userId);

  const [isLiked, setIsLiked] = React.useState(initDerivedIsLiked);
  // const [isBookmarked, setIsBookmarked] = React.useState(bookmarkedProp);

  const [listenToTTS, setListenToTTS] = React.useState(false);

  const [enableGallery, setEnableGallery] = React.useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = React.useState(0);

  const { isCopied: isExpContentCopied, copyToClipboard: copyExpContent } =
    useCopyToClipboard({ timeout: 2000 });

  const promptAuthorName = Author?.name || '';
  const promptAuthorFirstName = promptAuthorName
    ? getUsersFirstNameFromName(promptAuthorName)
    : '';
  const promptAuthorUsername = Author?.username || '';
  const promptAuthorProfilePermalink =
    getUserProfilePermalink(promptAuthorUsername);

  const promptCompletedPermalink = expId
    ? createUserCompletedPromptChallengePermalink(expId)
    : '';

  const onHandleNotAuthenticated = () => {
    toast('You must be signed in to engage with an experience.');
  };

  // Media Gallery
  const onHandleOpeningMediaGallery = (index = 0) => {
    setEnableGallery(true);
    setSelectedMediaIndex(index);
  };

  const onHandleClosingMediaGallery = () => {
    setEnableGallery(false);
    setSelectedMediaIndex(0);
  };

  const onCopyExperienceContent = () => {
    if (isExpContentCopied) return;

    let postContent = `Experience Nevada Prompt Challenge\n\n${promptQuestion}\n\n${plainContent}`;

    if (promptAuthorProfilePermalink) {
      const fullProfilePermalink = `${window.location.origin}${promptAuthorProfilePermalink}`;

      postContent = promptAuthorName
        ? `${postContent}\n\nBy ${promptAuthorName}\nvia Experience Nevada\n${fullProfilePermalink}`
        : `${postContent}\n\n${fullProfilePermalink}`;
    }

    const expLink = promptCompletedPermalink;

    if (expLink) {
      const expPermalink = `${window.location.origin}${expLink}`;
      postContent = `${postContent}\n\n${expPermalink}`;
    }

    SingleExperienceEngagementToast(
      <IconCopy className="size-4" />,
      'Prompt challenge content copied',
      postContent
    );
    copyExpContent(postContent);
  };

  const handleListeningToTTS = (nextState?: boolean) => {
    if (typeof nextState === 'boolean') {
      setListenToTTS(nextState);
      return;
    }

    setListenToTTS((prev) => !prev);
  };

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      onHandleNotAuthenticated();
      return;
    }

    const nextIsLiked = !isLiked;

    // Optimistic UI update
    setIsLiked(nextIsLiked);
    SingleExperienceEngagementToast(
      nextIsLiked ? (
        <IconHeart className="size-4 fill-destructive stroke-destructive" />
      ) : (
        <IconHeart className="size-4" />
      ),
      `Experience ${isLiked ? 'unliked' : 'liked'}`,
      plainContent
    );

    const actionResponse = await togglesUsersExperienceLikeStatus(
      nextIsLiked,
      userId,
      expId
    );

    // Handle the response
    if (actionResponse.error) {
      toast(`Error updating experience like status: ${actionResponse.msg}`);
      // Revert the like status
      setIsLiked(!nextIsLiked);
    } else if (!actionResponse.error && actionResponse.record) {
      // toast(`Experience ${isLiked ? 'unliked' : 'liked'}`);
    }
  };

  if (!isExpPrompt) {
    return null;
  }

  const promptResponse = expPrompt.richContent || expPrompt.content;

  const sortedMedia = sortRawMediaForGallery<ExperienceMediaModel[]>(
    expPrompt.Media || [],
    true
  );

  const hasMedia = Boolean(sortedMedia.length);

  const ttsAuthorName = promptAuthorName;
  let ttsContent = `${promptQuestion}\n\n${plainContent}`;
  if (ttsAuthorName) {
    ttsContent = `${ttsContent}\n\nBy ${ttsAuthorName} via Experience Nevada`;
  } else {
    ttsContent = `${ttsContent}\n\nvia Experience Nevada`;
  }

  return (
    <>
      <div
        className={cn(
          'relative flex w-full flex-col justify-center gap-6 rounded-xl bg-blue-900/30 p-4 text-base backdrop-blur-lg dark:bg-green-900/60 md:text-lg lg:p-6',
          className
        )}
      >
        <div className="flex w-full flex-col gap-4">
          <ReactMarkdownExtended className="prose lg:prose-lg prose-p:first:mt-0">
            {promptResponse}
          </ReactMarkdownExtended>

          {/* Play Content Audio */}
          {ttsContent && (
            <div className="flex w-full items-center justify-start gap-2 text-foreground/80">
              <SimpleTextToSpeech
                expId={expId}
                expAuthorId={expAuthorId}
                open={listenToTTS}
                text={ttsContent}
                label="Play"
                btnSize="xs"
                btnClassName="px-3 bg-white/5 hover:bg-white/10"
                handleOnOpenChange={handleListeningToTTS}
              />

              {/* Copy Content */}
              {true && (
                <Button
                  variant="ghost"
                  size="xs"
                  // disabled={isDisabled}
                  className="group/post-icon gap-1.5 rounded-full bg-white/5 p-2 px-3 text-sm hover:bg-white/10"
                  onClick={onCopyExperienceContent}
                >
                  {isExpContentCopied && (
                    <IconCheck className="text-success-foreground" />
                  )}
                  {!isExpContentCopied && (
                    <IconCopy
                      className={cn(
                        'brightness-75 transition duration-150 hover:cursor-pointer group-hover/post-icon:scale-105 group-hover/post-icon:brightness-100'
                      )}
                    />
                  )}
                  <span className="">Copy Text</span>
                </Button>
              )}
            </div>
          )}
        </div>

        {hasMedia && (
          <div className="w-full">
            <ExperienceMedia
              videoAutoPlay
              showIndividualMapIcon
              media={sortedMedia}
              onClickSingleMediaGallery={onHandleOpeningMediaGallery}
            />
          </div>
        )}
        <CompletedExperienceResponseCtas experience={expPrompt} />

        <div className="flex flex-col items-start justify-center gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-0">
            {false && (
              <Button
                variant="ghost"
                size="off"
                // disabled={isDisabled}
                className="group/post-icon rounded-full p-2 hover:bg-accent/80"
                onClick={handleToggleLike}
              >
                <IconHeart
                  className={cn(
                    'brightness-75 transition-colors duration-150 hover:cursor-pointer hover:brightness-100',
                    {
                      'fill-destructive': isLiked,
                      'stroke-destructive': isLiked,
                    }
                  )}
                />
              </Button>
            )}
          </div>
        </div>
      </div>
      {enableGallery && hasMedia && (
        <ExperiencePostMediaGallery
          open
          noShowContent
          selectedIndex={selectedMediaIndex}
          handleOnClose={onHandleClosingMediaGallery}
          experience={expPrompt}
          collaborator={expPrompt?.Author}
          media={sortedMedia}
        />
      )}
    </>
  );
}
