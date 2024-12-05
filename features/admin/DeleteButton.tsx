'use client';

import { useCallback, type ComponentProps } from 'react';
import { useAppState } from '@/state/app-state';
import clsx from 'clsx';
import { BiTrash } from 'react-icons/bi';

export default function DeleteButton(
  props: ComponentProps<typeof SubmitButtonWithStatus> & {
    clearLocalState?: boolean;
  }
) {
  const {
    onFormSubmit: onFormSubmitProps,
    clearLocalState,
    className,
    ...rest
  } = props;

  const { invalidateSwr, registerAdminUpdate } = useAppState();

  const onFormSubmit = useCallback(() => {
    onFormSubmitProps?.();
    if (clearLocalState) {
      invalidateSwr?.();
      registerAdminUpdate?.();
    }
  }, [onFormSubmitProps, clearLocalState, invalidateSwr, registerAdminUpdate]);

  return (
    <SubmitButtonWithStatus
      {...rest}
      title="Delete"
      icon={<BiTrash size={16} />}
      spinnerColor="text"
      className={clsx(
        className,
        '!text-red-500 dark:!text-red-600',
        'active:!bg-red-100/50 active:dark:!bg-red-950/50',
        'disabled:!bg-red-100/50 disabled:dark:!bg-red-950/50',
        '!border-red-200 hover:!border-red-300',
        'dark:!border-red-900/75 dark:hover:!border-red-900'
      )}
      onFormSubmit={onFormSubmit}
    />
  );
}
