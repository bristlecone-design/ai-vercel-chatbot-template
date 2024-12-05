import { Heading, List, ListOrdered, Text, TextQuote } from 'lucide-react';

import { Command, createSuggestionItems, renderItems } from './extensions';

export const suggestionSimpleItems = createSuggestionItems([
  {
    title: 'Text',
    description: 'Just start typing with plain text.',
    searchTerms: ['p', 'paragraph'],
    icon: <Text size={18} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleNode('paragraph', 'paragraph')
        .run();
    },
  },
  // {
  //   title: 'Lead',
  //   description: 'Lead paragraph.',
  //   searchTerms: ['p', 'paragraph'],
  //   icon: <Text size={18} />,
  //   command: ({ editor, range }) => {
  //     editor
  //       .chain()
  //       .focus()
  //       .deleteRange(range)
  //       .toggleNode('lead', 'paragraph')
  //       .run();
  //   },
  // },
  {
    title: 'Heading',
    description: 'Primary section heading.',
    searchTerms: ['subtitle', 'medium'],
    icon: <Heading size={18} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 3 })
        .run();
    },
  },
  {
    title: 'Subheading',
    description: 'Section heading.',
    searchTerms: ['subtitle', 'medium'],
    icon: <Heading size={12} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 4 })
        .run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Create a simple bullet list.',
    searchTerms: ['unordered', 'point'],
    icon: <List size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Create a list with numbering.',
    searchTerms: ['ordered'],
    icon: <ListOrdered size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'Quote',
    description: 'Capture a quote.',
    searchTerms: ['blockquote'],
    icon: <TextQuote size={18} />,
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleNode('paragraph', 'paragraph')
        .toggleBlockquote()
        .run(),
  },
  // {
  //   title: 'Separator',
  //   description: 'Create a separator.',
  //   searchTerms: ['divider', 'line', 'horizontal'],
  //   icon: <Minus size={18} />,
  //   command: ({ editor, range }) =>
  //     editor
  //       .chain()
  //       .focus()
  //       .deleteRange(range)
  //       .toggleNode('hr', 'hr')
  //       .togg()
  //       .run(),
  // },
]);

export const slashSimpleCommand = Command.configure({
  suggestion: {
    items: () => suggestionSimpleItems,
    render: renderItems,
  },
});
