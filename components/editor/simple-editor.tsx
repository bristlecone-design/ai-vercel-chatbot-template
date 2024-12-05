'use client';

import React, { useEffect, useState } from 'react';
// import Placeholder from '@tiptap/extension-placeholder';
import { useDebouncedCallback } from 'use-debounce';

import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

import { defaultEditorContent } from './content/default-editor-content';
import { setEditorClientContent } from './editor-client-utils';
import { EXP_NV_CONTENT_JSON_STORAGE_KEY } from './editor-storage-keys';
import { handleCommandNavigation, Placeholder } from './extensions';
import { simpleDefaultExtensions } from './extensions/extension-defaults';
import GenerativeMenuSwitch from './generative/generative-menu-switch';
// import { handleImageDrop, handleImagePaste } from './plugins';
import { LinkSelector } from './selectors/link-selector';
import { NodeBasicSelector } from './selectors/node-basic-selector';
import { TextBasicButtons } from './selectors/text-basic-buttons';
import {
  slashSimpleCommand,
  suggestionSimpleItems,
} from './slash-simple-command';
import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  EditorRoot,
  type EditorInstance,
  type JSONContent,
} from './src';

import { SITE_MAX_POST_CHARS } from '@/config/site-forms';

const extensions = [...simpleDefaultExtensions, slashSimpleCommand];

export type SimpleEditorProps = {
  autoFocus?: boolean;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  promptQuestion?: string;
  charLimit?: number;
  initialContent?: JSONContent | string | null;
  contentKeySuffix?: string;
  contentRef?: React.MutableRefObject<EditorInstance | null>;
  editor?: EditorInstance | null;
  onContentValueChange?: (plain: string, rich: string) => void;
  onUpdateCharacterCount?: (count: number) => void;
  onSetEditorInstance?: (editor: EditorInstance) => void;
};

export const SimpleEditor = ({
  autoFocus,
  className,
  disabled,
  charLimit = SITE_MAX_POST_CHARS,
  editor: editorProp,
  initialContent: initialContentProp,
  placeholder: placeholderTextProp,
  promptQuestion: promptQuestionProp,
  contentKeySuffix: contentKeySuffixProp = '',
  onContentValueChange,
  onUpdateCharacterCount,
  onSetEditorInstance,
}: SimpleEditorProps) => {
  // console.log('**** editor in SimpleEditor', editor);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  // Placeholder and Extensions
  const [placeholderText, setPlaceholderText] = useState<string | undefined>(
    promptQuestionProp || placeholderTextProp
  );

  const placeholder = Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === 'heading') {
        return `Heading ${node.attrs.level}`;
      }
      return placeholderText || '';
    },
    includeChildren: true,
  });

  const modExtensions = charLimit
    ? [...extensions].map((ext) => {
        if (ext.name === 'characterCount') {
          return ext.configure({ limit: charLimit });
        }
        return ext;
      })
    : extensions;

  const finalExtensions = [placeholder, ...modExtensions];

  // Content
  const [initialContent, setInitialContent] = useState<
    JSONContent | string | null | undefined
  >(initialContentProp);

  const [openNode, setOpenNode] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openAI, setOpenAI] = useState(false);

  // Content updates
  const debouncedUpdates = useDebouncedCallback(
    async (editor: EditorInstance) => {
      // setCharsCount(editor.storage.characterCount.words());
      setEditorClientContent(editor, contentKeySuffixProp);

      const text = editor.getText();
      const isOnlySlash = text === '/';

      if (!isOnlySlash && typeof onUpdateCharacterCount === 'function') {
        const charCount = editor.storage.characterCount.characters();
        onUpdateCharacterCount(charCount);
      }

      if (!isOnlySlash && typeof onContentValueChange === 'function') {
        const md = editor.storage.markdown.getMarkdown();
        onContentValueChange(text, md);
      }
    },
    500
  );

  /**
   * On mount, load content from local storage
   */
  useEffect(() => {
    const content = window.localStorage.getItem(
      EXP_NV_CONTENT_JSON_STORAGE_KEY
    );
    if (content) {
      setInitialContent(JSON.parse(content));
    } else {
      setInitialContent(defaultEditorContent);
    }
  }, []);

  /**
   * Update the placeholder text on prompt question prop change
   */
  useEffect(() => {
    if (
      editorProp &&
      placeholderText &&
      promptQuestionProp &&
      placeholderText !== promptQuestionProp
    ) {
      setPlaceholderText(promptQuestionProp);

      // Update the placeholder text
      for (const extension of editorProp.extensionManager.extensions) {
        if (extension.name === 'placeholder') {
          extension.options.placeholder = promptQuestionProp;
        }
      }
      // Update the editor options
      editorProp.setOptions();
    }
  }, [editorProp, placeholderText, promptQuestionProp]);

  if (!initialContent) return null;

  return (
    <div className={cn('relative w-full max-w-screen-lg', className)}>
      <EditorRoot>
        <EditorContent
          autofocus={autoFocus}
          ref={contentRef}
          initialContent={initialContent}
          extensions={finalExtensions}
          className="relative w-full max-w-screen-lg"
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            // handlePaste: (view, event) =>
            //   handleImagePaste(view, event, uploadFn),
            // handleDrop: (view, event, _slice, moved) =>
            //   handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              id: 'content-editor',
              class: cn(
                'prose lg:prose-lg dark:prose-invert prose-headings:font-title font-default text-foreground/90 prose-lead:text-foreground/95 prose-lead:font-medium focus-visible:outline-none max-w-full bg-background focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-0 rounded-xl border-4 border-border/90 py-5 px-3 prose-h3:mb-4',
                'prose-blockquote:text-lg prose-blockquote:font-semibold prose-blockquote:leading-relaxed prose-blockquote:text-foreground/85 prose-lead:font-medium prose-lead:text-foreground/95 md:prose-blockquote:text-xl prose-h3:lg:text-xl prose-h4:brightness-90'
              ),
            },
          }}
          onUpdate={({ editor }) => {
            debouncedUpdates(editor);
          }}
          onCreate={({ editor }) => {
            // Initialize the editor with the initial content and set the editor instance, etc.
            // console.log('Editor created', {
            //   editor,
            //   initialContent,
            //   editorProp,
            // });
            if (typeof onUpdateCharacterCount === 'function') {
              const charCount = editor.storage.characterCount.characters();
              onUpdateCharacterCount(charCount);
            }

            if (typeof onContentValueChange === 'function') {
              const text = editor.getText();
              const md = editor.storage.markdown.getMarkdown();
              onContentValueChange(text, md);
            }

            if (typeof onSetEditorInstance === 'function') {
              onSetEditorInstance(editor);
            }

            // Set the placeholder text to the prompt question if it exists
            if (promptQuestionProp) {
              for (const extension of editor.extensionManager.extensions) {
                if (extension.name === 'placeholder') {
                  extension.options.placeholder = promptQuestionProp;
                }
              }

              // Update the editor options
              editor.setOptions();
            }
          }}
          // slotAfter={<ImageResizer />}
        >
          <EditorCommand
            aria-disabled={disabled}
            className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all"
          >
            <EditorCommandEmpty className="px-2 text-muted-foreground">
              No results
            </EditorCommandEmpty>
            <EditorCommandList aria-disabled={disabled}>
              {suggestionSimpleItems.map((item) => (
                <EditorCommandItem
                  value={item.title}
                  onCommand={(val) => {
                    if (!item || !item.command) return;
                    item.command(val);
                  }}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                  key={item.title}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>

          <GenerativeMenuSwitch
            open={openAI}
            promptQuestion={promptQuestionProp}
            onOpenChange={setOpenAI}
          >
            <Separator orientation="vertical" />
            <NodeBasicSelector open={openNode} onOpenChange={setOpenNode} />
            <Separator orientation="vertical" />

            <LinkSelector open={openLink} onOpenChange={setOpenLink} />
            <Separator orientation="vertical" />
            {/* <MathSelector /> */}
            <Separator orientation="vertical" />
            <TextBasicButtons />
            {/* <Separator orientation="vertical" /> */}
            {/* <ColorSelector open={openColor} onOpenChange={setOpenColor} /> */}
          </GenerativeMenuSwitch>
        </EditorContent>
      </EditorRoot>
    </div>
  );
};
