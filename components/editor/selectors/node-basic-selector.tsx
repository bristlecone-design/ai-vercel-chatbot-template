import { Popover } from '@radix-ui/react-popover';
import {
  Check,
  ChevronDown,
  ListOrdered,
  TextIcon,
  TextQuote,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { EditorBubbleItem, useEditor } from '../src';

export type SelectorItem = {
  name: string;
  icon: LucideIcon;
  command: (editor: ReturnType<typeof useEditor>['editor']) => void;
  isActive: (editor: ReturnType<typeof useEditor>['editor']) => boolean;
};

const items: SelectorItem[] = [
  {
    name: 'Text',
    icon: TextIcon,
    command: (editor) => editor?.chain().focus().clearNodes().run(),
    // I feel like there has to be a more efficient way to do this – feel free to PR if you know how!
    isActive: (editor) => {
      if (!editor) return false;

      return (
        editor.isActive('paragraph') &&
        !editor.isActive('bulletList') &&
        !editor.isActive('orderedList')
      );
    },
  },
  {
    name: 'Bullet List',
    icon: ListOrdered,
    command: (editor) => {
      if (!editor) return;
      return editor.chain().focus().clearNodes().toggleBulletList().run();
    },
    isActive: (editor) => {
      if (!editor) return false;
      return editor.isActive('bulletList');
    },
  },
  {
    name: 'Numbered List',
    icon: ListOrdered,
    command: (editor) => {
      if (!editor) return;
      return editor.chain().focus().clearNodes().toggleOrderedList().run();
    },
    isActive: (editor) => {
      if (!editor) return false;
      return editor.isActive('orderedList');
    },
  },
  {
    name: 'Quote',
    icon: TextQuote,
    command: (editor) => {
      if (!editor) return;
      return editor.chain().focus().clearNodes().toggleBlockquote().run();
    },
    isActive: (editor) => {
      if (!editor) return false;
      return editor.isActive('blockquote');
    },
  },
];
interface NodeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NodeBasicSelector = ({
  open,
  onOpenChange,
}: NodeSelectorProps) => {
  const { editor } = useEditor();
  if (!editor) return null;
  const activeItem = items.filter((item) => item.isActive(editor)).pop() ?? {
    name: 'Multiple',
  };

  return (
    <Popover modal={true} open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        asChild
        className="gap-2 rounded-none border-none hover:bg-accent focus:ring-0"
      >
        <Button size="sm" variant="ghost" className="gap-2">
          <span className="whitespace-nowrap text-sm">{activeItem.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent sideOffset={5} align="start" className="w-48 p-1">
        {items.map((item) => (
          <EditorBubbleItem
            key={item.name}
            onSelect={(editor) => {
              item.command(editor);
              onOpenChange(false);
            }}
            className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-sm hover:bg-accent"
          >
            <div className="flex items-center space-x-2">
              <div className="rounded-sm border p-1">
                <item.icon className="h-3 w-3" />
              </div>
              <span>{item.name}</span>
            </div>
            {activeItem.name === item.name && <Check className="h-4 w-4" />}
          </EditorBubbleItem>
        ))}
      </PopoverContent>
    </Popover>
  );
};
