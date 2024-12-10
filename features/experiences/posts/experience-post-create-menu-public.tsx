'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useUserPrompts } from '@/state/prompt-provider';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

import {
  ExperienceCreateHoverMenu,
  type ExperienceCreateHoverMenuProps,
} from './experience-post-create-hover-menu';

/**
 * Helper component to render the create experience menu for public users. It really just redirects users to the login page.
 *
 *
 */

export type ExperienceCreateMenuPublicProps =
  Partial<ExperienceCreateHoverMenuProps> & {
    portal?: boolean;
  };

export function ExperienceCreateMenuPublic({
  openDelay = 275,
  className,
  portal = true,
}: ExperienceCreateMenuPublicProps) {
  const router = useRouter();
  const pathname = usePathname();

  const callbackUrl = pathname;
  const loginUrl = `/login?callbackUrl=${callbackUrl}`;

  // const { userLocation } = useAppState();

  const {
    userPromptChallengeAcceptance,
    handleTogglingPromptChallengeAcceptance,
  } = useUserPrompts();

  const handleEnableCreateFlow = () => {
    router.push(loginUrl);
  };

  const handleCreatingAnExperience = () => {
    // Disable the prompt challenge acceptance
    if (userPromptChallengeAcceptance) {
      handleTogglingPromptChallengeAcceptance(false);
    }

    router.push(loginUrl);
  };

  const handleAcceptingPromptChallenge = () => {
    // Enable the prompt challenge acceptance
    handleTogglingPromptChallengeAcceptance(true);
    handleCreatingAnExperience();
  };

  const node = (
    <div className={cn('fixed bottom-2 right-2 z-50', className)}>
      <ExperienceCreateHoverMenu
        openDelay={openDelay}
        className="relative"
        // location={userLocation}
        handleEnableCreateFlow={handleEnableCreateFlow} // Wherever user left off or default creation flow
        handleCreatingAnExperience={handleCreatingAnExperience}
        handleAcceptingPromptChallenge={handleAcceptingPromptChallenge}
      />
    </div>
  );

  return portal ? createPortal(node, document.body) : node;
}
