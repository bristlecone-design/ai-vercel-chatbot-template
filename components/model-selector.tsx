'use client';

import { startTransition, useMemo, useOptimistic, useState } from 'react';

import { models } from '@/lib/ai/models';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { saveModelId } from '@/app/(chat)/actions';

import { IconChevronDown, IconCircleCheck } from './ui/icons';

export function ModelSelector({
  selectedModelId,
  className,
}: {
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  const selectModel = useMemo(
    () => models.find((model) => model.id === optimisticModelId),
    [optimisticModelId]
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'max-w-40 data-[state=open]:bg-accent data-[state=closed]:text-foreground/55 data-[state=open]:text-accent-foreground sm:w-fit sm:max-w-fit',
          className
        )}
      >
        <Button
          variant="ghost"
          className="gap-1.5 bg-transparent backdrop-blur-sm hover:bg-transparent hover:backdrop-blur-lg md:h-[34px] md:px-2"
        >
          <span className="truncate">
            {selectModel?.labelLong || selectModel?.label}
          </span>
          <IconChevronDown
            className={cn({
              'text-success': open,
            })}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {models
          .filter((m) => m.active)
          .map((model) => (
            <DropdownMenuItem
              key={`${model.id}-${model.label}-${model.id}`}
              onSelect={() => {
                setOpen(false);

                startTransition(() => {
                  setOptimisticModelId(model.id);
                  saveModelId(model.id);
                });
              }}
              className="group/item flex flex-row items-center justify-between gap-4"
              data-active={model.id === optimisticModelId}
            >
              <div className="flex flex-col items-start gap-1">
                {model.label}
                {model.description && (
                  <div className="text-xs text-muted-foreground">
                    {model.description}
                  </div>
                )}
              </div>
              <div className="text-primary opacity-0 group-data-[active=true]/item:opacity-100 dark:text-primary-foreground">
                <IconCircleCheck className="text-success" />
              </div>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
