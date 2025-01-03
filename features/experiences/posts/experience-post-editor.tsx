'use client';

/**
 * Handle editing of an experience post
 */
import React, { useRef } from 'react';
import { clearTagCache } from '@/actions/cache';
import { CACHE_KEY_USER_EXPERIENCE } from '@/actions/cache-keys';
import { useKey, useLocalStorage } from 'react-use';
import { toast } from 'sonner';

import { updateExperienceContent } from '@/lib/db/queries/experiences-updates';
import { sleep } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { IconSpinner } from '@/components/ui/icons';
import { clearEditorClientContent } from '@/components/editor/editor-client-utils';
import { SimpleEditor } from '@/components/editor/simple-editor';
import type { EditorInstance } from '@/components/editor/src';

export function EditSingleExperiencePost({
  expId,
  autoFocus,
  disabled,
  charLimit,
  promptQuestion,
  rawContent: rawContentProp,
  richContent: richContentProp,
  handleCancelEdit: handleCancelEditProp,
  handleCloseEdit: handleCloseEditProp,
  handleOnUpdateContent: handleOnUpdateContentProp,
}: {
  expId: string;
  rawContent: string;
  richContent: string;
  autoFocus?: boolean;
  disabled?: boolean;
  charLimit?: number;
  promptQuestion?: string;
  editor?: EditorInstance | null;
  handleCancelEdit: () => void;
  handleCloseEdit: () => void;
  handleOnUpdateContent: (rawText: string, mdText: string) => void;
}) {
  const editorInstanceRef = useRef<EditorInstance | null>(null);

  const [isUpdating, setIsUpdating] = React.useState(false);

  const [expContentCharLimit, setExpContentCharCount] = React.useState<
    null | number
  >(null);

  const [expRawContent, setExpRawContent] = useLocalStorage(
    `exp-raw-content-${expId}`,
    rawContentProp
  );

  const [expRichContent, setExpRichContent] = useLocalStorage(
    `exp-rich-content-${expId}`,
    richContentProp
  );

  const handleSettingEditorInstance = (instance: EditorInstance | null) => {
    editorInstanceRef.current = instance;
  };

  const handleUpdatingCharacterCount = (count: number) => {
    setExpContentCharCount(count);
  };

  const handleUpdatingRawContent = (value: string) => {
    setExpRawContent(value);
  };

  const handleUpdatingRichContent = (value: string) => {
    setExpRichContent(value);
  };

  const handleUpdatingContentValues = (plain: string, rich: string) => {
    handleUpdatingRawContent(plain);
    handleUpdatingRichContent(rich);
  };

  const handleClearingContent = () => {
    handleUpdatingRawContent('');
    handleUpdatingRichContent('');
    // Main editor
    clearEditorClientContent(editorInstanceRef.current, expId);
  };

  const handleOnSaveContentUpdate = async () => {
    if (typeof handleOnUpdateContentProp === 'function') {
      handleOnUpdateContentProp(
        expRawContent as string,
        expRichContent as string
      );
    }

    setIsUpdating(true);

    const saveResponse = await updateExperienceContent(
      expId,
      expRawContent as string,
      expRichContent as string
    );

    if (saveResponse?.data) {
      toast.success('Content updated successfully 🎉');

      const { AudioMedia = [] } = saveResponse.data;

      if (AudioMedia.length) {
        await sleep(1750);
        toast.info("Don't forget to regenerate the audio media content too!");
      }

      const cacheKeysToClear = [expId, `${expId}-${CACHE_KEY_USER_EXPERIENCE}`];

      for (const key of cacheKeysToClear) {
        clearTagCache(key);
      }

      // handleClearingContent();
    }

    setIsUpdating(false);

    handleCloseEditProp();
  };

  useKey(
    'Escape',
    () => {
      handleCancelEditProp();
    },
    { event: 'keyup' },
    []
  );

  // Set the initial content on mount
  React.useEffect(() => {
    if (richContentProp && !expRichContent) {
      setExpRichContent(richContentProp);
    }
  }, [richContentProp, expRichContent]);

  const isRichContentSame = expRichContent === richContentProp;
  const isDisabled = disabled || isUpdating;

  return (
    <div className="flex flex-col gap-2">
      <SimpleEditor
        autoFocus={autoFocus}
        disabled={isDisabled}
        charLimit={charLimit}
        contentKeySuffix={expId}
        initialContent={expRichContent}
        promptQuestion={promptQuestion}
        editor={editorInstanceRef.current}
        onUpdateCharacterCount={handleUpdatingCharacterCount}
        onSetEditorInstance={handleSettingEditorInstance}
        onContentValueChange={handleUpdatingContentValues}
      />
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={isDisabled}
          onClick={handleCancelEditProp}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          variant="tertiary"
          disabled={isDisabled || isRichContentSame}
          onClick={() => handleOnSaveContentUpdate()}
          className="gap-1.5"
        >
          {isUpdating && <IconSpinner className="animate-spin" />}
          {isUpdating ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
