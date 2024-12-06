'use client';

import { useEffect, useRef, type ComponentProps } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';

import { LoaderButton } from './loader-btn';

interface Props extends ComponentProps<typeof LoaderButton> {
  onFormStatusChange?: (pending: boolean) => void;
  onFormSubmitToastMessage?: string;
  onFormSubmit?: () => void;
  primary?: boolean;
}

export function SubmitButtonWithStatus({
  icon,
  onFormStatusChange,
  onFormSubmitToastMessage,
  onFormSubmit,
  children,
  disabled,
  className,
  primary,
  type: _type,
  ...buttonProps
}: Props) {
  const { pending } = useFormStatus();

  const pendingPrevious = useRef(pending);

  useEffect(() => {
    if (!pending && pendingPrevious.current) {
      if (onFormSubmitToastMessage) {
        toast(onFormSubmitToastMessage);
      }
      onFormSubmit?.();
    }
    pendingPrevious.current = pending;
  }, [pending, onFormSubmitToastMessage, onFormSubmit]);

  useEffect(() => {
    onFormStatusChange?.(pending);
  }, [onFormStatusChange, pending]);

  return (
    <LoaderButton
      type="submit"
      disabled={disabled}
      className={className}
      icon={icon}
      isLoading={pending}
      {...buttonProps}
    >
      {children}
    </LoaderButton>
  );
}
