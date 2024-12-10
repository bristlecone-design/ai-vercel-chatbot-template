'use client';

import type React from 'react';
import { useUserPrompts } from '@/state/prompt-provider';

import { ViewPromptsSelectionDialog } from './view-prompts-selection-dialog';

export function ViewCompletedPromptMisc({
  children,
}: {
  children?: React.ReactNode;
}) {
  // const { isAuthenticated } = useAppState();

  const {
    isPromptSelectionOpen,
    handlePaginatingPromptChallenges: paginatePrompts,
  } = useUserPrompts();

  return (
    <div className="w-full">
      {children}
      {isPromptSelectionOpen && (
        <ViewPromptsSelectionDialog open={isPromptSelectionOpen} />
      )}
    </div>
  );
}
