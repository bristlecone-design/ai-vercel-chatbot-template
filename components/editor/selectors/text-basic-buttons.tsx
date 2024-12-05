import { BoldIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { EditorBubbleItem, useEditor } from '../src';
import type { SelectorItem } from './node-selector';

export const TextBasicButtons = () => {
  const { editor } = useEditor();
  if (!editor) return null;
  const items: SelectorItem[] = [
    {
      name: 'bold',
      isActive: (editor) => {
        if (!editor) return false;
        return editor.isActive('bold');
      },
      command: (editor) => {
        if (!editor) return;
        return editor.chain().focus().toggleBold().run();
      },
      icon: BoldIcon,
    },
  ];
  return (
    <div className="flex">
      {items.map((item) => (
        <EditorBubbleItem
          key={item.name}
          onSelect={(editor) => {
            item.command(editor);
          }}
        >
          <Button
            type="button"
            size="sm"
            className="rounded-none"
            variant="ghost"
          >
            <item.icon
              className={cn('h-4 w-4', {
                'text-blue-500': item.isActive(editor),
              })}
            />
          </Button>
        </EditorBubbleItem>
      ))}
    </div>
  );
};
