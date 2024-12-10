'use client';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
  type TooltipContentProps,
} from '@/components/ui/tooltip';

import { IconInfo } from './ui/icons';

export type BaseTooltipContentProps = {
  simple?: boolean;
  title?: string;
  content: React.ReactNode;
  titleClassName?: string;
  contentClassName?: string;
  className?: string;
};

export function BaseTooltipContent({
  simple = true,
  title,
  content,
  contentClassName,
  titleClassName,
  className,
}: BaseTooltipContentProps) {
  if (simple && !title) {
    return content;
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <h3 className={cn('font-semibold', titleClassName)}>{title}</h3>
      <div className={cn('font-normal', contentClassName)}>{content}</div>
    </div>
  );
}

export type BaseTooltipProps = {
  open?: boolean;
  asChild?: TooltipContentProps['asChild'];
  align?: TooltipContentProps['align'];
  side?: TooltipContentProps['side'];
  alignOffset?: TooltipContentProps['alignOffset'];
  sideOffset?: TooltipContentProps['sideOffset'];
  content: React.ReactNode;
  delayDuration?: number;
  children?: React.ReactNode;
  container?: HTMLElement;
  className?: string;
  triggerClassName?: string;
};

export function BaseTooltip({
  open = false,
  asChild = true,
  triggerClassName,
  align = 'center',
  side = 'top',
  delayDuration = 225,
  sideOffset = 12,
  content,
  children,
  container,
  className,
  alignOffset = 0,
}: BaseTooltipProps) {
  if (!children) {
    return null;
  }

  if (!content) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip defaultOpen={open}>
        <TooltipTrigger asChild={asChild} className={triggerClassName}>
          {children}
        </TooltipTrigger>
        <TooltipPortal container={container}>
          <TooltipContent
            side={side}
            align={align}
            alignOffset={alignOffset}
            sideOffset={sideOffset}
            className={cn('tooltip z-[1000] max-w-64', className)}
          >
            {content}
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider>
  );
}

export type SharedInfoTooltipProps = {
  title: string;
  content: string;
  open?: boolean;
  asChild?: boolean;
  align?: TooltipContentProps['align'];
  side?: TooltipContentProps['side'];
  children?: React.ReactNode;
  triggerClassName?: string;
  handleOnClick?: (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
};

export function SharedInfoTooltip({
  asChild = false,
  title,
  content,
  children,
  align,
  side,
  open = false,
  triggerClassName,
  handleOnClick,
}: SharedInfoTooltipProps) {
  return (
    <BaseTooltip
      open={open}
      align={align}
      side={side}
      asChild={asChild}
      triggerClassName={triggerClassName}
      content={<BaseTooltipContent title={title} content={content} />}
    >
      <>
        {!children && (
          <IconInfo
            onClick={(e) => {
              if (handleOnClick) {
                handleOnClick(e);
              } else {
                // Prevent a form from submitting when the info icon is clicked
                e.stopPropagation();
                e.preventDefault();
              }
            }}
            className="text-foreground/80"
          />
        )}
        {children}
      </>
    </BaseTooltip>
  );
}
