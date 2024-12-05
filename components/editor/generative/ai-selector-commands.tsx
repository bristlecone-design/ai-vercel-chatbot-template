import {
  ArrowDownWideNarrow,
  CheckCheck,
  RefreshCcwDot,
  StepForward,
  WrapText,
} from 'lucide-react';

import {
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

import { getPrevText } from '../editor-utils';
import { useEditor } from '../src';

const options = [
  {
    value: 'improve',
    label: 'Improve writing',
    icon: RefreshCcwDot,
  },

  {
    value: 'fix',
    label: 'Fix grammar',
    icon: CheckCheck,
  },
  {
    value: 'shorter',
    label: 'Make shorter',
    icon: ArrowDownWideNarrow,
  },
  {
    value: 'longer',
    label: 'Make longer',
    icon: WrapText,
  },
];

interface AISelectorCommandsProps {
  onSelect: (value: string, option: string) => void;
}

const AISelectorCommands = ({ onSelect }: AISelectorCommandsProps) => {
  const { editor } = useEditor();

  return (
    <CommandList className="">
      {/* <CommandGroup heading="Edit or review selection">
        {options.map((option) => (
          <CommandItem
            onSelect={(value) => {
              if (!editor) return;
              const slice = editor.state.selection.content();
              const text = editor.storage.markdown.serializer.serialize(
                slice.content
              );
              onSelect(text, value);
            }}
            className="flex gap-2 px-4"
            key={option.value}
            value={option.value}
          >
            <option.icon className="text-ai-assist-foreground size-4" />
            {option.label}
          </CommandItem>
        ))}
      </CommandGroup>
      <CommandSeparator /> */}
      <CommandGroup heading="OR...use AI to">
        <CommandItem
          onSelect={(value) => {
            if (!editor) return;
            const pos = editor.state.selection.from;
            // console.log('**** from pos for continue writing', pos);

            const text = getPrevText(editor, pos);
            console.log('**** Continue command invoked', { value, text });
            onSelect(text, 'continue');
          }}
          value="continue"
          className="gap-2 px-4"
        >
          <StepForward className="text-ai-assist-foreground size-4" />
          Continue writing idea/thought...
        </CommandItem>
      </CommandGroup>
    </CommandList>
  );
};

export default AISelectorCommands;
