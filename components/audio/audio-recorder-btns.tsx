'use client';

import { cn } from '@/lib/utils';

import { Button, type ButtonProps } from '../ui/button';
import { IconMic, IconStop } from '../ui/icons';

export interface GeneralAudioBtnProps extends ButtonProps {}

export function GeneralAudioBtn({
  className,
  children,
  ...rest
}: GeneralAudioBtnProps) {
  return (
    <Button
      type="button"
      className={cn('h-fit rounded-full p-1.5', className)}
      {...rest}
    >
      {children}
    </Button>
  );
}

export interface RecordAudioBtnProps extends GeneralAudioBtnProps {
  className?: string;
  recording?: boolean;
  paused?: boolean;
  stopRecording?: boolean;
}

export function RecordAudioBtn({
  className,
  disabled,
  paused: pausedProp = false,
  recording: recordingProp = false,
  stopRecording: stopRecordingProp,
  onClick,
  ...rest
}: RecordAudioBtnProps) {
  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (typeof onClick === 'function') {
      onClick(e);
    }
  };

  return (
    <GeneralAudioBtn
      type="button"
      variant={disabled ? 'outline' : 'destructive'}
      className={cn(
        'h-fit rounded-full p-1.5',
        {
          'animate-pulse': recordingProp,
        },
        className
      )}
      onClick={handleOnClick}
      disabled={disabled}
    >
      {!recordingProp && !pausedProp && <IconMic className="size-4" />}
      {(recordingProp || pausedProp) && <IconStop className="size-4" />}{' '}
      <span className="sr-only">Record</span>
    </GeneralAudioBtn>
  );
}
