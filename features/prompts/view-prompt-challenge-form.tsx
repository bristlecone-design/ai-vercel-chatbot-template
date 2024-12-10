'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { streamPersonalizedResponseToUserPromptReply } from '@/actions/experience-prompts';
import { useAppState } from '@/state/app-state';
import { useUserPrompts } from '@/state/prompt-provider';
import { readStreamableValue } from 'ai/rsc';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { ExperienceCreateForm } from '../experiences/experience-create-form';
import { NUM_OF_ALLOWED_MEDIA_ATTACHMENTS } from '../experiences/experience-post-constants';
import { useUserExperiencePosts } from '../experiences/posts/experience-posts-provider';
import {
  createPromptChallengePermalink,
  createUserCompletedPromptChallengePermalink,
} from '../experiences/utils/experience-prompt-utils';
import { ViewPromptChallengeCreationDialog } from './view-prompt-creation-dialog';
import { ViewPromptJoinExpNv } from './view-prompt-join-exp-nv';
import { ViewPromptsCompletedDialog } from './view-prompts-completed-dialog';
import { ViewPromptsSelectionDialog } from './view-prompts-selection-dialog';

import type { GeneratedExperienceUserPrompt } from '@/types/experience-prompts';
import type { ExperienceModel } from '@/types/experiences';

export function ViewPromptChallengeFormPublic({
  focusOnMount,
  waitlistCount,
}: {
  focusOnMount?: boolean;
  waitlistCount?: number;
}) {
  const { isAuthenticated } = useAppState();

  const {
    isPromptSelectionOpen,
    currentUserPrompt,
    userSelectedPrompt,
    currentUserPromptChallengeSet: currentPrompts,
    // userPromptChallengeContext,
    // fetchingPrompts,
    userPromptChallengeAcceptance: promptChallengeAccepted,
    handleTogglingPromptSelectionView,
    handleSelectingRandomPromptChallenge,
    handleTogglingPromptChallengeAcceptance,
    // handleSelectingPromptChallenge,
    handlePaginatingPromptChallenges: paginatePrompts,
  } = useUserPrompts();

  const inputContentRef = React.useRef<HTMLTextAreaElement>(null);
  const promptToShow = userSelectedPrompt || currentUserPrompt;

  return (
    <div className="w-full">
      <ExperienceCreateForm
        noInputTitle
        disabled={!isAuthenticated}
        // hideSubmitButton
        // formRef={formRef}
        //   promptChallengeToggleDisabled
        noFocusOnOpen={!focusOnMount}
        inputContentRef={inputContentRef}
        submitBtnLabel="Share"
        inputTitleLabelClassName="hidden"
        inputContentLabelClassName="hidden"
        numOfAllowedMedia={NUM_OF_ALLOWED_MEDIA_ATTACHMENTS}
        // existingMediaToAttach={existingMediaToAttach}
        inputContentPlaceholder={currentUserPrompt?.prompt}
        //   disabled={isFormProcessing || experienceCreated}
        promptChallenge={promptToShow}
        promptChallengeEnabled={promptChallengeAccepted}
        //   handleOnComplete={handleOnCreateExperienceComplete}
        //   handleOnSuccess={handleOnSuccessfulExperienceCreate}
        handleTogglingPromptChallengeAcceptance={
          handleTogglingPromptChallengeAcceptance
        }
        handleSelectingNewRandomPrompt={handleSelectingRandomPromptChallenge}
        handleViewingPromptChallenges={handleTogglingPromptSelectionView}
      />
      {isPromptSelectionOpen && (
        <ViewPromptsSelectionDialog open={isPromptSelectionOpen} />
      )}
      <ViewPromptJoinExpNv waitlistCount={waitlistCount} className="" />
    </div>
  );
}

export function ViewPromptChallengeFormAuthenticated({
  focusOnMount,
  promptId,
}: {
  promptId?: string;
  focusOnMount?: boolean;
}) {
  const formRef = React.useRef<HTMLFormElement>(null);

  const router = useRouter();

  const { userFirstName, isAuthenticated } = useAppState();
  // console.log(`***** isAuthenticated`, isAuthenticated);

  const {
    isPromptSingleView,
    isUserSelectedPromptCompleted,
    isPromptSelectionOpen,
    promptPaginationEnabled,
    currentUserPrompt,
    userSelectedPrompt,
    currentUserPromptChallengeSet: currentPrompts,
    isPromptCompletionDialogOpen,
    userPromptChallenges = [],
    // userPromptChallengeContext,
    fetchingPrompts,
    userPromptChallengeAcceptance: promptChallengeAccepted,
    handleClearingPromptIdCache,
    handleTogglingPromptSelectionView,
    handleSelectingRandomPromptChallenge,
    handleTogglingPromptChallengeAcceptance,
    handleSelectingPromptChallenge,
    handleOnSuccessfullyCreatedPromptChallenge,
    handleTogglingCompletePromptView,
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

  // Focus on the input content when the prompt challenge is accepted
  // Note: for Authenticated users only
  const handleOnSelectingPromptChallenge = (
    prompt?: GeneratedExperienceUserPrompt
  ) => {
    if (isAuthenticated && inputContentRef.current) {
      // console.log(
      //   `**** handleOnSelectingPromptChallenge invoked`,
      //   inputContentRef.current
      // );
      inputContentRef.current.focus();
      inputContentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
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
    // console.log(
    //   '***** handleOnSuccessCreatingExperience for prompt challenge invoked',
    //   {
    //     newExperience,
    //     completedPrompt,
    //   }
    // );

    if (completedPrompt) {
      // Show success message / dialog
      setExperienceCreatedSuccessfully(true);
      setCompletedExperience(newExperience);

      // Clear the prompt id cache to prepare for routing to the prompt challenge completion view
      // handleClearingPromptIdCache(completedPrompt.id, true);

      // Generate personalized reply to the user's response if not already generated
      // if (!personalizedReply) {
      //   handleGeneratingPersonalizedReply(
      //     newExperience.content,
      //     completedPrompt.prompt
      //   );
      // }

      // Update the prompt challenge set and pick a new random prompt
      // handleOnSuccessfullyCreatedPromptChallenge(
      //   completedPrompt,
      //   true,
      //   false,
      //   true
      // );

      // Update the experience provider, cache but don't close the dialog
      handleOnSuccessfullyCreatedExperience(newExperience, clearCache, false);
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

    // Derive prompt challenge completion view permalink
    const completedPromptPermalink = completedPromptExpId
      ? createUserCompletedPromptChallengePermalink(completedPromptExpId)
      : completedPromptId
        ? createPromptChallengePermalink(completedPromptId)
        : '';

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
    if (completedPromptPermalink) {
      router.push(completedPromptPermalink);
      router.refresh();
    }
  };

  // if (isUserSelectedPromptCompleted) {
  //   return null;
  // }

  const showCreationDialog =
    creatingExperience || isCreationPending || experienceCreatedSuccessfully;

  // const editorContentKey = userSelectedPrompt?.id || promptId;

  return (
    <>
      <div className="flex w-full flex-col gap-2.5">
        <ExperienceCreateForm
          noInputTitle
          // hideSubmitButton
          //   promptChallengeToggleDisabled
          formRef={formRef}
          hideSubmitButton
          noFocusOnOpen={!focusOnMount}
          inputContentRef={inputContentRef}
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
      </div>

      {isPromptSelectionOpen && (
        <ViewPromptsSelectionDialog
          open={isPromptSelectionOpen}
          handleOnSelection={handleOnSelectingPromptChallenge}
        />
      )}

      {isPromptCompletionDialogOpen && (
        <ViewPromptsCompletedDialog
          open={isPromptCompletionDialogOpen}
          handleOnClose={handleTogglingCompletePromptView}
        />
      )}

      {showCreationDialog && (
        <ViewPromptChallengeCreationDialog
          open={showCreationDialog}
          created={experienceCreatedSuccessfully}
          personalizedReply={personalizedReply}
          completedExperience={completedPrompt}
          handleOnClose={handleOnClosePromptChallengeSuccessDialog}
        />
      )}
    </>
  );
}
