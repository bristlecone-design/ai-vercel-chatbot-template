import type { Selection } from '@tiptap/pm/state';
import {
  Check,
  ListPlus,
  ListRestart,
  TextQuote,
  TrashIcon,
} from 'lucide-react';

import {
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

import { useEditor } from '../src';

export type AICompletionCommandsProps = {
  completion: string;
  onDiscard: (resetCompletion?: boolean) => void;
  onReset?: () => void;
};

const AICompletionCommands = ({
  completion,
  onDiscard,
  onReset,
}: AICompletionCommandsProps) => {
  const { editor } = useEditor();
  return (
    <CommandList>
      <CommandGroup>
        {/* Append Completion to Current Selection */}
        <CommandItem
          className="gap-2 px-4"
          value="append"
          onSelect={() => {
            if (!editor) return;
            const selection = editor.view.state.selection as Selection;
            // console.log('appending to selection', {
            //   selection,
            //   to: selection.to,
            //   from: selection.from,
            //   head: selection.head,
            //   anchor: selection.anchor,
            //   content: selection.content(),
            //   completion,
            // });

            editor
              .chain()
              .focus()
              .insertContentAt(
                {
                  from: selection.to + 1,
                  to: selection.to + 1,
                },
                completion
              )
              .run();

            onDiscard();
          }}
        >
          <ListPlus className="size-4 text-muted-foreground" />
          Append to selection
        </CommandItem>
        {/* Replace Selection */}
        <CommandItem
          className="gap-2 px-4"
          value="replace"
          onSelect={() => {
            if (!editor) return;
            const selection = editor.view.state.selection as Selection;

            editor
              .chain()
              .focus()
              .insertContentAt(
                {
                  from: selection.from,
                  to: selection.to,
                },
                completion
              )
              .run();
          }}
        >
          <Check className="size-4 text-muted-foreground" />
          Replace selection
        </CommandItem>
        {/* Insert Below */}
        <CommandItem
          className="gap-2 px-4"
          value="insert"
          onSelect={() => {
            if (!editor) return;
            const selection = editor.view.state.selection;
            editor
              .chain()
              .focus()
              .insertContentAt(selection.to + 1, completion)
              .run();
          }}
        >
          <TextQuote className="size-4 text-muted-foreground" />
          Insert below
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      {/* Discard */}
      <CommandGroup>
        {onReset && (
          <CommandItem
            onSelect={() => onReset()}
            value="clear"
            className="gap-2 px-4"
          >
            <ListRestart className="size-4 text-muted-foreground" />
            Clear
          </CommandItem>
        )}
        <CommandItem
          onSelect={() => onDiscard()}
          value="thrash"
          className="gap-2 px-4"
        >
          <TrashIcon className="size-4 text-muted-foreground" />
          Discard
        </CommandItem>
      </CommandGroup>
    </CommandList>
  );
};

export default AICompletionCommands;
