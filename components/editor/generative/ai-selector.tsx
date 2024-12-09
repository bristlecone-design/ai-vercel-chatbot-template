'use client';

import { useState } from 'react';
import { DraftingExperiencesSchema } from '@/schemas/experiences/drafting-experiences-schemas';
import { experimental_useObject as useObject } from 'ai/react';
import { ArrowUp } from 'lucide-react';
import { toast } from 'sonner';

import { getErrorMessage } from '@/lib/errors';
import { nanoid } from '@/lib/id';
import { Button } from '@/components/ui/button';
import { Command, CommandInput } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ReactMarkdownExtended } from '@/components/content/md/markdown';
import { Prose } from '@/components/prose';

import { addAIHighlight } from '../extensions';
import { CrazySpinner } from '../icons/crazy-spinner';
import { Magic } from '../icons/magic';
import { useEditor } from '../src';
import AICompletionCommands from './ai-completion-command';
import AISelectorCommands from './ai-selector-commands';

//TODO: I think it makes more sense to create a custom Tiptap extension for this functionality https://tiptap.dev/docs/editor/ai/introduction

interface AISelectorProps {
  open: boolean;
  promptQuestion?: string;
  onOpenChange: (open: boolean) => void;
}

export function AISelector({
  promptQuestion: promptQuestionProp,
  onOpenChange,
}: AISelectorProps) {
  const { editor } = useEditor();
  const [generatedId, setGeneratedId] = useState(nanoid());
  const [zapInstructions, setZapInstructions] = useState('');

  // @see https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-completion
  const {
    object,
    isLoading: isGenerating,
    submit,
    stop,
  } = useObject({
    id: generatedId,
    api: '/api/generate/experiences/assistance',
    schema: DraftingExperiencesSchema,
    onFinish: (response) => {
      if (response.object) {
        zapInstructions && setZapInstructions('');
      }
    },
    onError: (e) => {
      const errMessage = getErrorMessage(e);
      toast.error(errMessage);
    },
  });

  // Destruction of the object
  const introResponse = object?.introResponse || '';
  const closingResponse = object?.closingResponse || '';
  const suggestion = object?.suggestion || '';

  // Combine the responses and add new lines, but replace all empty lines with a single new line if there are blank lines
  const completeResponse =
    `${introResponse}\n\n${suggestion}\n\n${closingResponse}`.replace(
      /\n{3,}/g,
      '\n\n'
    );

  // const { completion, complete, setCompletion } = useCompletion({
  //   id: 'exp-nv-user-ai-assistance',
  //   api: '/api/generate/experiences/assistance',
  //   onResponse: (response) => {
  //     if (response.status === 429) {
  //       toast.error('You have reached your request limit for the day.');
  //       return;
  //     }
  //   },
  //   onError: (e) => {
  //     toast.error(e.message);
  //   },
  // });

  const updateGeneratedId = () => {
    setGeneratedId(nanoid());
  };

  const handleResettingCompletion = () => {
    if (completeResponse) {
      updateGeneratedId();
      // setCompletion('');
    }
  };

  const handleDiscarding = (resetCompletion = true) => {
    if (!editor) return;
    editor.chain().unsetHighlight().focus().run();
    onOpenChange(false);

    if (resetCompletion) {
      handleResettingCompletion();
    }
  };

  const handleCompletionSubmit = (
    selectedText = '',
    option = 'zap',
    promptQuestion = promptQuestionProp
  ) => {
    if (option === 'zap' && !zapInstructions) {
      toast.error('Please provide instructions for the AI to proceed.');
      return;
    }
    // if (completion) {
    //   return submit(completion, {
    //     body: {
    //       option: 'zap',
    //       command: zapInstructions,
    //       question: promptQuestion,
    //     },
    //   }).then(() => setZapInstructions(''));
    // }

    if (!editor) return;

    const slice = editor.state.selection.content();
    const context =
      selectedText ||
      editor.storage.markdown.serializer.serialize(slice.content);

    submit({
      context, // The existing text (input)
      option, // The AI option (continue, improve, shorter, longer, fix, zap)
      command: zapInstructions, // The command (instructions) for the zap option (optional)
      question: promptQuestion, // The question related to the text (input) (optional)
    });
  };

  return (
    <Command className="w-[350px] md:w-108">
      {completeResponse && (
        <div className="flex max-h-[400px]">
          <ScrollArea>
            <Prose className="p-2 px-4 brightness-75">
              <ReactMarkdownExtended>{completeResponse}</ReactMarkdownExtended>
            </Prose>
          </ScrollArea>
        </div>
      )}
      {isGenerating && (
        <div className="text-ai-assist-foreground flex h-12 w-full items-center px-4 text-sm font-medium">
          <Magic className="mr-2 size-4 shrink-0" />
          AI is thinking
          <div className="ml-2 mt-1">
            <CrazySpinner />
          </div>
        </div>
      )}
      {!isGenerating && (
        <>
          <div className="relative flex w-full items-center px-2">
            <CommandInput
              autoFocus
              value={zapInstructions}
              onValueChange={setZapInstructions}
              placeholder={
                completeResponse
                  ? 'Tell AI what to do next'
                  : 'Ask AI to edit or generate...'
              }
              onFocus={() => {
                if (!editor) return;
                return addAIHighlight(editor);
              }}
              onKeyDown={(e) => {
                const value = e.currentTarget.value;
                if (value && e.key === 'Enter') {
                  handleCompletionSubmit();
                }
                e.stopPropagation();
                // e.preventDefault();
              }}
              containerClassName="grow px-0"
              className=""
            />
            <Button
              size="icon"
              disabled={!zapInstructions}
              className="bg-ai-assist-foreground/80 hover:bg-ai-assist-foreground size-6 rounded-full"
              onClick={() => {
                handleCompletionSubmit();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCompletionSubmit();
              }}
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
          {suggestion ? (
            <AICompletionCommands
              onDiscard={handleDiscarding}
              // onReset={handleResettingCompletion}
              completion={suggestion}
            />
          ) : (
            <AISelectorCommands
              onSelect={(value, option) => {
                handleCompletionSubmit(value, option);
              }}
            />
          )}
        </>
      )}
    </Command>
  );
}
