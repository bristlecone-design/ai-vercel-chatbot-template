import React, { Fragment, useEffect, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';

import { removeAIHighlight } from '../extensions';

import '../plugins';

import { Magic } from '../icons/magic';
import { EditorBubble, useEditor } from '../src';
import { AISelector } from './ai-selector';

interface GenerativeMenuSwitchProps {
  children: ReactNode;
  open: boolean;
  promptQuestion?: string;
  onOpenChange: (open: boolean) => void;
}
const GenerativeMenuSwitch = ({
  children,
  open,
  promptQuestion,
  onOpenChange,
}: GenerativeMenuSwitchProps) => {
  const { editor } = useEditor();
  const askAiBtnRef = React.useRef<HTMLButtonElement | null>(null);
  // console.log(`promptQuestion in GenerativeMenuSwitch: ${promptQuestion}`);

  useEffect(() => {
    if (!editor) return;
    if (askAiBtnRef.current) {
      askAiBtnRef.current.focus();
    }
    if (!open) removeAIHighlight(editor);
  }, [open]);

  return (
    <EditorBubble
      tippyOptions={{
        placement: open ? 'bottom-start' : 'top',
        onHidden: () => {
          onOpenChange(false);
          if (editor) {
            editor.chain().unsetHighlight().run();
          }
        },
      }}
      className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
    >
      {open && (
        <AISelector
          open={open}
          promptQuestion={promptQuestion}
          onOpenChange={onOpenChange}
        />
      )}
      {!open && (
        <Fragment>
          <Button
            ref={askAiBtnRef}
            className="text-ai-assist-foreground gap-1 rounded-none focus:bg-secondary focus-visible:bg-secondary"
            variant="ghost"
            onClick={() => onOpenChange(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onOpenChange(true);
            }}
            size="sm"
          >
            <Magic className="size-5" />
            Ask AI
          </Button>
          {children}
        </Fragment>
      )}
    </EditorBubble>
  );
};

export default GenerativeMenuSwitch;
