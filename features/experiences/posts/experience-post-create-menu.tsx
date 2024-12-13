'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/state/app-state';
import { useUserPrompts } from '@/state/prompt-provider';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

import {
  ExperienceCreateHoverMenu,
  type ExperienceCreateHoverMenuProps,
} from './experience-post-create-hover-menu';
import { useUserExperiencePosts } from './experience-posts-provider';

/**
 * Helper component to render the create experience menu and trigger the create experience modal.
 *
 * @note Requires the parent component to have the @UserExperiencePostsProvider context provider.
 *
 * @note Requires the parent component to handle the logic for creating an experience.
 *
 */

export type ExperienceCreateMenuProps =
  Partial<ExperienceCreateHoverMenuProps> & {
    portal?: boolean;
    contentEditorId?: string;
    routeToChallenges?: boolean;
    challengesViewPath?: string;
  };

export function ExperienceCreateMenu({
  openDelay = 275,
  className,
  portal = true,
  routeToChallenges = true,
  challengesViewPath = '/prompts',
  contentEditorId = 'content-editor',
  handleCreatingAnExperience: handleCreatingAnExperienceProp,
  handleOnCloseExperienceDialog: handleOnCloseExperienceDialogProp,
}: ExperienceCreateMenuProps) {
  const portalNodeRef = React.useRef<Element | null>(null);

  const router = useRouter();
  // const pathname = usePathname();
  // const isOnChallengesView = pathname.startsWith('/prompts');
  // const isOnCHallengesRootView = pathname === '/prompts';

  // const [contentEditor, setContentEditor] = React.useState<HTMLElement | null>(
  //   null
  // );

  const { userLocation } = useAppState();
  // const [rerouting, setRerouting] = React.useState(false);

  const {
    userPromptChallengeAcceptance,
    handleTogglingPromptChallengeAcceptance,
  } = useUserPrompts();

  const {
    createExperienceEnabled,
    handleEnablingCreateExperience,
    // handleDisablingCreateExperience,
    // handleOnSuccessfullyCreatedExperience,
  } = useUserExperiencePosts();
  // console.log(`**** experienceData`, experienceData);

  const handleCreatingAnExperience = () => {
    // Disable the prompt challenge acceptance
    if (userPromptChallengeAcceptance) {
      handleTogglingPromptChallengeAcceptance(false);
    }

    handleEnablingCreateExperience();

    if (typeof handleCreatingAnExperienceProp === 'function') {
      handleCreatingAnExperienceProp();
    }
  };

  const handleAcceptingPromptChallenge = () => {
    // Enable the prompt challenge acceptance
    handleTogglingPromptChallengeAcceptance(true);

    if (routeToChallenges) {
      router.push(challengesViewPath);
      // setRerouting(true);
      return;
    }

    handleCreatingAnExperience();
  };

  const handleEnableCreateFlow = (openGenExp = false) => {
    if (
      routeToChallenges &&
      (userPromptChallengeAcceptance || routeToChallenges)
    ) {
      router.push(challengesViewPath);
      // setRerouting(true);
      return;
    }

    if (openGenExp) {
      handleCreatingAnExperience();
      return;
    }
  };

  // Query for the content editor DOM element with ID of content-editor and set it to the state
  // React.useEffect(() => {
  //   if (!contentEditor) {
  //     const contentEditor = document.getElementById(contentEditorId);
  //     setContentEditor(contentEditor);
  //   }
  // }, [contentEditor, contentEditorId]);

  // Set the portal node ref to the document.body on mount
  React.useEffect(() => {
    portalNodeRef.current = document.body;
  }, []);

  if (createExperienceEnabled) {
    return null;
  }

  const node = (
    <div className={cn('fixed bottom-2 right-2 z-50', className)}>
      <ExperienceCreateHoverMenu
        // rerouting={rerouting}
        openDelay={openDelay}
        className="relative"
        location={userLocation}
        handleEnableCreateFlow={handleEnableCreateFlow} // Wherever user left off or default creation flow
        handleCreatingAnExperience={handleCreatingAnExperience}
        handleAcceptingPromptChallenge={handleAcceptingPromptChallenge}
      />
    </div>
  );

  return portal
    ? createPortal(
        node,
        portalNodeRef.current || document?.createDocumentFragment()
      )
    : node;
}
