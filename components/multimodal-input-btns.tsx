import { cn } from '@/lib/utils';

import { Button, type ButtonProps } from './ui/button';
import { IconArrowUp, IconClose, IconPaperclip, IconStop } from './ui/icons';

export interface MultimodalInputBtnsProps extends ButtonProps {}

export function MultimodalBaseBtn({
  disabled,
  className,
  children,
  ...rest
}: MultimodalInputBtnsProps) {
  return (
    <Button
      disabled={disabled}
      className={cn('h-fit rounded-full border p-1.5', className)}
      {...rest}
    >
      {children}
    </Button>
  );
}

export function MultimodalSubmitBtn({
  disabled,
  className,
  handleOnSubmit,
  ...rest
}: MultimodalInputBtnsProps & {
  handleOnSubmit: () => void;
}) {
  return (
    <MultimodalBaseBtn
      onClick={(e) => {
        e.preventDefault();
        handleOnSubmit();
      }}
      disabled={disabled}
      className={cn('', className)}
      {...rest}
    >
      <IconArrowUp />
    </MultimodalBaseBtn>
  );
}

export function MultimodalStopBtn({
  disabled,
  className,
  handleOnClick,
  ...rest
}: MultimodalInputBtnsProps & {
  handleOnClick: () => void;
}) {
  return (
    <MultimodalBaseBtn
      onClick={(e) => {
        e.preventDefault();
        handleOnClick();
      }}
      disabled={disabled}
      className={cn('', className)}
      {...rest}
    >
      <IconStop />
    </MultimodalBaseBtn>
  );
}

export function MultimodalAttachFilesBtn({
  disabled,
  className,
  handleOnClick,
  ...rest
}: MultimodalInputBtnsProps & {
  handleOnClick: () => void;
}) {
  return (
    <MultimodalBaseBtn
      variant="outline"
      onClick={(e) => {
        e.preventDefault();
        handleOnClick();
      }}
      disabled={disabled}
      className={cn('', className)}
      {...rest}
    >
      <IconPaperclip className="-rotate-45" />
    </MultimodalBaseBtn>
  );
}

export function MultimodalClearInputBtn({
  disabled,
  className,
  handleOnClick,
  ...rest
}: MultimodalInputBtnsProps & {
  handleOnClick: () => void;
}) {
  return (
    <MultimodalBaseBtn
      variant="outline"
      onClick={(e) => {
        e.preventDefault();
        handleOnClick();
      }}
      disabled={disabled}
      className={cn('', className)}
      {...rest}
    >
      <IconClose className="" />
    </MultimodalBaseBtn>
  );
}
