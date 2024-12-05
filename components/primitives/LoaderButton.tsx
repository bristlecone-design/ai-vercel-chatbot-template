import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

import { cn } from '@/lib/utils';
import { Spinner } from '@/components/spinner';

export default function LoaderButton(
  props: {
    isLoading?: boolean;
    icon?: ReactNode;
    styleAs?: 'button' | 'link' | 'link-without-hover';
    hideTextOnMobile?: boolean;
    shouldPreventDefault?: boolean;
  } & ButtonHTMLAttributes<HTMLButtonElement>
) {
  const {
    children,
    isLoading,
    icon,
    styleAs = 'button',
    hideTextOnMobile = true,
    shouldPreventDefault,
    type = 'button',
    onClick,
    disabled,
    className,
    ...rest
  } = props;

  return (
    <button
      {...rest}
      type={type}
      onClick={(e) => {
        if (shouldPreventDefault) {
          e.preventDefault();
        }
        onClick?.(e);
      }}
      className={cn(
        ...(styleAs !== 'button'
          ? ['link active:text-medium h-4', 'disabled:!bg-transparent']
          : ['h-9']),
        styleAs === 'link' && 'hover:text-dim',
        styleAs === 'link-without-hover' && 'hover:text-main',
        'inline-flex items-center gap-2 self-start',
        className
      )}
      disabled={isLoading || disabled}
    >
      {(icon || isLoading) && (
        <span
          className={clsx(
            'h-4 min-w-[1.25rem]',
            styleAs === 'button'
              ? 'translate-y-[-0.5px]'
              : 'translate-y-[0.5px]',
            'inline-flex justify-center'
          )}
        >
          {isLoading ? (
            <Spinner
              className={
                styleAs === 'button'
                  ? 'translate-y-[2px]'
                  : 'translate-y-[0.5px]'
              }
            />
          ) : (
            icon
          )}
        </span>
      )}
      {children && (
        <span
          className={clsx(
            styleAs !== 'button' && isLoading && 'text-dim',
            hideTextOnMobile && icon !== undefined && 'hidden sm:inline-block'
          )}
        >
          {children}
        </span>
      )}
    </button>
  );
}
