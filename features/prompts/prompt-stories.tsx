'use client';

import React, { useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { clearTagCache } from '@/actions/cache';
import { streamPersonalizedResponseToUserPromptReply } from '@/actions/experience-prompts';
import { useAppState } from '@/state/app-state';
import { useUserPrompts } from '@/state/prompt-provider';
import { readStreamableValue } from 'ai/rsc';
import { motion } from 'framer-motion';
import { md5 } from 'js-md5';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';

import { cn } from '@/lib/utils';
import { useGetInitialState, useUpdateURL } from '@/hooks/use-update-url';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconClose } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { LinkCta } from '@/components/cta-link';

import { ExperienceCreateForm } from '../experiences/experience-create-form';
import { NUM_OF_ALLOWED_MEDIA_ATTACHMENTS } from '../experiences/experience-post-constants';
import { SingleExperiencePost } from '../experiences/posts/experience-posts';
import { useUserExperiencePosts } from '../experiences/posts/experience-posts-provider';
import {
  createSingleCompletedStoryPromptChallengePermalink,
  createSingleStoryPromptChallengePermalink,
} from '../experiences/utils/experience-prompt-utils';
import { ChallengePromptProseContainer } from './prompt-shared-containers';
import { ViewPromptChallengeCreationDialog } from './view-prompt-creation-dialog';
import { ViewPromptJoinExpNv } from './view-prompt-join-exp-nv';

import type {
  ExperienceUserPromptModel,
  GeneratedExperienceUserPrompt,
  PromptStoryModel,
} from '@/types/experience-prompts';
import type { ExperienceModel } from '@/types/experiences';
import type { USER_PROFILE_MODEL } from '@/types/user';

export function PromptStoriesItem({
  item,
  delay = 0,
  disabled = false,
  className,
  storyPath,
  handleOnSelectingPrompt,
}: {
  delay?: number;
  disabled?: boolean;
  className?: string;
  storyPath: string;
  item: ExperienceUserPromptModel;
  handleOnSelectingPrompt?: (prompt: ExperienceUserPromptModel) => void;
}) {
  const router = useRouter();

  const promptId = item.id;
  const promptTitle = item.title;
  const promptQuestion = item.prompt;

  const storyPromptPermalink = createSingleStoryPromptChallengePermalink(
    promptId,
    storyPath
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    if (storyPromptPermalink) {
      router.prefetch(storyPromptPermalink);
    }
  }, []);

  const { activities = [], interests = [] } = item;

  const activitiesAndInterests = [...activities, ...interests];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, translateY: 250 }}
      animate={{
        scale: 1,
        opacity: [0.1, 0.2, 0.3, 0.4, 0.25, 0.5, 0.75, 0.65, 0.85, 1],
        translateY: 0,
      }}
      transition={{ type: 'spring', duration: 1, delay: 0.03 * delay }}
      onClick={() => {
        if (disabled) return;
        if (typeof handleOnSelectingPrompt === 'function') {
          handleOnSelectingPrompt(item);
        }
      }}
      className={cn('', className)}
    >
      <LinkCta
        noShowIcon
        href={storyPromptPermalink}
        size="off"
        variant="secondary"
        textClassName="flex flex-col gap-4 items-start"
        className={cn(
          'group/prompt-stories-item relative',
          'h-full items-center justify-start whitespace-normal rounded-2xl border-2 border-transparent px-4 py-2',
          'brightness-75 hover:brightness-90',
          'text-base font-normal leading-snug lg:text-xl lg:font-normal',
          'bg-secondary/50 bg-gradient-to-b hover:border-secondary hover:from-amber-700 hover:to-amber-700/75',
          {
            'flex-col items-start justify-center':
              activitiesAndInterests.length > 0,
          }
        )}
      >
        <span>{item.prompt}</span>
        {activitiesAndInterests.length > 0 && (
          <div className="mt-1 flex w-full flex-nowrap gap-1.5 overflow-x-auto">
            {activitiesAndInterests.map((activity, index) => {
              // Remove any single quotes
              const maskedActivity = activity.replace(/'/g, '');
              const baseKey = `prompt-activity-${promptId}-${promptTitle}-${maskedActivity}-${index}`;

              const hashKey = md5(baseKey);

              return (
                <Badge
                  key={hashKey}
                  variant="default"
                  className={cn(
                    'bg-muted font-normal text-foreground/80',
                    'whitespace-nowrap group-hover/prompt-stories-item:bg-secondary'
                  )}
                >
                  {maskedActivity}
                </Badge>
              );
            })}
          </div>
        )}
      </LinkCta>
    </motion.div>
  );
}

export type ViewStoryPromptsProps = {
  className?: string;
  promptsClassName?: string;
  prompts: ExperienceUserPromptModel[];
  storyPath: string;
};

export function ViewStoryPrompts({
  className,
  promptsClassName,
  prompts: promptsProp,
  storyPath,
}: ViewStoryPromptsProps) {
  // Prompts
  const [prompts, setPrompts] = React.useState(promptsProp);

  // Get initial state
  const initialUrlState = useGetInitialState();
  const initialQueryState = initialUrlState?.q || '';

  // Search
  const updateURL = useUpdateURL();

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const [searchValue, setSearchValue] = React.useState(initialQueryState);

  // Filter prompts via fuse
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const searchPrompts = useCallback(
    async (
      value: string,
      // define the setCb as a typeof setPrompts
      setCb = setPrompts
    ): Promise<ExperienceUserPromptModel[]> => {
      // console.log(`**** debounced invoked`, { value });
      // Dynamically load fuse.js
      const Fuse = (await import('fuse.js')).default;
      const fuse = new Fuse(promptsProp, {
        keys: [
          'prompt',
          'title',
          'content',
          'location',
          'interests',
          'activities',
        ],
        threshold: 0.5,
        distance: 50,
        includeScore: true,
      });

      const results = fuse
        .search(value)
        .map((result) => result.item) as ExperienceUserPromptModel[];
      // console.log(`Search results`, { results });

      if (typeof setCb === 'function') {
        setCb(results);
      }

      return results || ([] as ExperienceUserPromptModel[]);
    },
    [promptsProp, searchValue]
  );

  const debounced = useDebouncedCallback(async (value) => {
    updateURL({ q: value });
    await searchPrompts(value, setPrompts);
  }, 250);

  const handleClearingSearch = () => {
    setSearchValue('');
    setPrompts(promptsProp);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  React.useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Set initial prompts by search params if defined
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    if (initialQueryState) {
      const initializeSearchPrompts = async () => {
        await searchPrompts(initialQueryState, setPrompts);
      };
      initializeSearchPrompts();
    }
  }, []);

  const numOfCurrentPromptItems = prompts.length;
  const hasSearchText = Boolean(searchValue.length);

  return (
    <ChallengePromptProseContainer
      className={cn('flex flex-col gap-6 sm:gap-8', className)}
    >
      <div className={cn('relative w-full')}>
        <Input
          ref={searchInputRef}
          name="search"
          placeholder="Search story series prompts"
          className={cn(
            'h-[unset] rounded-xl border-2 px-4 py-2 text-lg leading-none placeholder:text-lg placeholder:text-muted-foreground/80'
          )}
          // defaultValue={''}
          value={searchValue}
          onChange={(e) => {
            const { value } = e.currentTarget;

            if (value) {
              debounced(value);
            } else {
              updateURL({ q: '' });
              setPrompts(promptsProp);
            }

            setSearchValue(value);
          }}
        />
        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 transform items-center">
          <Badge variant="outline">{numOfCurrentPromptItems}</Badge>

          <Button
            size="icon"
            variant="ghost"
            disabled={!searchValue}
            className="size-8 rounded-full"
            onClick={() => {
              handleClearingSearch();
            }}
          >
            <IconClose
              className={cn('size-4', {
                'brightness-50': !hasSearchText,
              })}
            />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          'grid grid-cols-1 gap-4 md:grid-cols-1',
          promptsClassName
        )}
      >
        {prompts.map((prompt, index) => {
          return (
            <PromptStoriesItem
              key={prompt.id}
              storyPath={storyPath}
              item={prompt}
              delay={index}
              // handleOnSelectingPrompt={(prompt) => {
              //   router.push(`/prompts/${prompt.id}`);
              // }}
            />
          );
        })}
      </div>
    </ChallengePromptProseContainer>
  );
}

export type ViewSingleStoryPromptFormProps = {
  className?: string;
  focusOnMount?: boolean;
  waitlistCount?: number;
  storyId: string;
  storyPath?: string;
  prompt: ExperienceUserPromptModel | GeneratedExperienceUserPrompt;
};

export function ViewSingleStoryPromptForm({
  prompt,
  storyId,
  storyPath,
  className,
  waitlistCount,
  focusOnMount = true,
}: ViewSingleStoryPromptFormProps) {
  const formRef = React.useRef<HTMLFormElement>(null);

  const router = useRouter();

  const { userFirstName } = useAppState();

  const {
    isPromptSingleView,
    currentUserPrompt,
    userSelectedPrompt,
    currentUserPromptChallengeSet: currentPrompts,
    // isPromptCompletionDialogOpen,
    // userPromptChallenges = [],
    // userPromptChallengeContext,
    // fetchingPrompts,
    userPromptChallengeAcceptance: promptChallengeAccepted,
    // handleClearingPromptIdCache,
    handleTogglingPromptSelectionView,
    handleSelectingRandomPromptChallenge,
    handleTogglingPromptChallengeAcceptance,
    // handleSelectingPromptChallenge,
    handleOnSuccessfullyCreatedPromptChallenge,
    // handleTogglingCompletePromptView,
    handlePaginatingPromptChallenges: paginatePrompts,
  } = useUserPrompts();

  const {
    // Handlers
    handleOnSuccessfullyCreatedExperience,
  } = useUserExperiencePosts();

  // Stream personalized reply to the user
  const [personalizedReply, setPersonalizedReply] = React.useState<string>('');

  const [isCreationPending, startTransition] = useTransition();

  const [creatingExperience, setCreatingExperience] = React.useState<boolean>();

  const [experienceCreatedSuccessfully, setExperienceCreatedSuccessfully] =
    React.useState<boolean>(false);

  const [completedPrompt, setCompletedExperience] =
    React.useState<null | ExperienceModel>(null);

  const inputContentRef = React.useRef<HTMLTextAreaElement>(null);

  /**
   * Handle generating personalized reply to the user's prompt challenge response
   */
  const handleGeneratingPersonalizedReply = async (
    userResponse: string,
    generatedPrompt: string
  ) => {
    if (!userResponse || !generatedPrompt) {
      return;
    }
    // console.log(`***** handleGeneratingPersonalizedReply invoked`, {
    //   userResponse,
    //   generatedPrompt,
    // });

    const { reply } = await streamPersonalizedResponseToUserPromptReply(
      userResponse,
      generatedPrompt,
      userFirstName
    );

    // @see https://sdk.vercel.ai/examples/next-app/basics/streaming-text-generation
    for await (const delta of readStreamableValue(reply)) {
      setPersonalizedReply(
        (currentGeneration) => `${currentGeneration}${delta}`
      );
    }
  };

  /**
   * Handle submitting the prompt challenge response
   */
  const handleOnSubmitPrompseResponse = () => {
    if (formRef.current) {
      const isFormValid = formRef.current.reportValidity();
      if (isFormValid) {
        formRef.current.requestSubmit();
      } else {
        toast.error('Please fill out the required info');
      }
    }
  };

  /**
   * Handle on the start of creating a prompt challenge experience
   */
  const handleOnStartCreatingExperience = async (
    content?: string,
    prompt?: string
  ) => {
    startTransition(() => {
      setCreatingExperience(true);
    });

    if (content && prompt) {
      await handleGeneratingPersonalizedReply(content, prompt);
    }
  };

  /**
   * Handle the successful creation of a prompt challenge experience
   *
   * @note Invoked by main creation flow/form when the user successfully creates a prompt challenge experience
   *
   * @note Triggers the generation of a personalized reply to the user's response
   *
   */
  const handleOnSuccessCreatingExperience = (
    newExperience: ExperienceModel,
    clearCache = true
  ) => {
    const { Prompt: completedPrompt } = newExperience;

    if (completedPrompt) {
      // Clear story path cache
      if (clearCache && storyPath) {
        clearTagCache(storyPath);
      }

      // Show success message / dialog
      setExperienceCreatedSuccessfully(true);
      setCompletedExperience(newExperience);

      // Update the experience provider, cache but don't close the dialog
      if (typeof handleOnSuccessfullyCreatedExperience === 'function') {
        handleOnSuccessfullyCreatedExperience(newExperience, clearCache, false);
      }
    }
    // TODO: handle error case
  };

  /**
   * Handle what happens when the user closes the prompt challenge success dialog
   *
   * @note Route to the prompt challenge completion view and clear the prompt cache
   */
  const handleOnClosePromptChallengeSuccessDialog = (
    completedExperience: ExperienceModel
  ) => {
    const { Prompt: completedPrompt, id: completedPromptExpId } =
      completedExperience;

    const { id: completedPromptId } = completedPrompt || {};

    // Prompt permalinks are unique based on the promptId and experienceId
    const completedStoryPromptPermalink =
      createSingleCompletedStoryPromptChallengePermalink(
        completedPromptExpId,
        completedPromptId,
        storyPath
      );

    // Clear local state
    setExperienceCreatedSuccessfully(false);
    setCompletedExperience(null);
    setPersonalizedReply('');
    setCreatingExperience(false);

    // Clear prompt cache (don't pick a new prompt)
    const pickNewPrompt = !isPromptSingleView;
    handleOnSuccessfullyCreatedPromptChallenge(
      completedPrompt as GeneratedExperienceUserPrompt,
      pickNewPrompt,
      false,
      true
    );

    // Route to the prompt challenge completion view
    if (completedStoryPromptPermalink) {
      router.push(completedStoryPromptPermalink);
      router.refresh();
    }
  };

  const showCreationDialog =
    creatingExperience || isCreationPending || experienceCreatedSuccessfully;

  return (
    <>
      <ChallengePromptProseContainer className="relative flex flex-col gap-6 sm:gap-8">
        <ExperienceCreateForm
          noInputTitle
          // hideSubmitButton
          noPromptChallengeRefresh
          promptChallengeToggleDisabled
          noPromptChallengeViewAll
          noPromptChallengeInfo
          formRef={formRef}
          hideSubmitButton
          noFocusOnOpen={!focusOnMount}
          inputContentRef={inputContentRef}
          promptStorySwitchDisabld
          promptStoryId={storyId}
          submitBtnLabel="Share"
          inputTitleLabelClassName="hidden"
          inputContentLabelClassName="hidden"
          // editorContentKey={editorContentKey}
          numOfAllowedMedia={NUM_OF_ALLOWED_MEDIA_ATTACHMENTS}
          // existingMediaToAttach={existingMediaToAttach}
          inputContentPlaceholder={currentUserPrompt?.prompt}
          //   disabled={isFormProcessing || experienceCreated}
          promptChallenge={userSelectedPrompt}
          promptChallengeEnabled={promptChallengeAccepted}
          //   handleOnComplete={handleOnCreateExperienceComplete}
          handleOnStartCreating={handleOnStartCreatingExperience}
          handleOnSuccess={handleOnSuccessCreatingExperience}
          handleTogglingPromptChallengeAcceptance={
            handleTogglingPromptChallengeAcceptance
          }
          handleSelectingNewRandomPrompt={handleSelectingRandomPromptChallenge}
          handleViewingPromptChallenges={handleTogglingPromptSelectionView}
        />

        <Button type="button" onClick={() => handleOnSubmitPrompseResponse()}>
          Share
        </Button>

        <ViewPromptJoinExpNv
          className=""
          waitlistCount={waitlistCount}
          onChallengeSectionCtaLabel="Join to Contribute Your Story"
        />
      </ChallengePromptProseContainer>

      {showCreationDialog && (
        <ViewPromptChallengeCreationDialog
          open={showCreationDialog}
          storyId={storyId}
          storyPath={storyPath}
          title="Saving Your Story Series Contribution"
          completedTitle="Story Series Contribution Saved"
          created={experienceCreatedSuccessfully}
          personalizedReply={personalizedReply}
          completedExperience={completedPrompt}
          handleOnClose={handleOnClosePromptChallengeSuccessDialog}
        />
      )}
    </>
  );
}

export type ViewSingleCompletedStoryPromptProps = {
  className?: string;
  story: PromptStoryModel;
  prompt: ExperienceUserPromptModel | GeneratedExperienceUserPrompt;
  experience: ExperienceModel;
  expAuthor: USER_PROFILE_MODEL | undefined;
  titleLink?: string;
  storyLink?: string;
  promptTitleLink?: string;
  isAuthUserExpOwner?: boolean;
};

export function ViewSingleCompletedStoryPrompt({
  story,
  prompt,
  className,
  experience,
  expAuthor,
  titleLink,
  storyLink,
  promptTitleLink,
  isAuthUserExpOwner,
}: ViewSingleCompletedStoryPromptProps) {
  return (
    <SingleExperiencePost
      noPromptTitle
      noStoryTitle
      noCallToActions
      isNonProfileView
      userProfile={expAuthor}
      experience={experience}
      titleLink={titleLink}
      storyLink={storyLink}
      redirectPathOnDelete={storyLink}
      promptTitleLink={promptTitleLink}
      context={isAuthUserExpOwner ? 'author' : 'viewer'}
      promptChallengeLabel="Share Your Experience"
    />
  );
}
