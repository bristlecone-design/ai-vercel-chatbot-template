'use client';

import { useEffect, useState } from 'react';

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
  stopRecording?: boolean;
}

export function RecordAudioBtn({
  className,
  disabled,
  recording: recordingProp = false,
  stopRecording: stopRecordingProp,
  onClick,
  ...rest
}: RecordAudioBtnProps) {
  const [recording, setRecording] = useState(recordingProp);

  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setRecording((prev) => !prev);

    if (typeof onClick === 'function') {
      onClick(e);
    }
  };

  // Stop recording if stopRecordingProp is true and recording is true
  useEffect(() => {
    if (typeof stopRecordingProp === 'boolean' && recording) {
      setRecording(false);
    }
  }, [recording, stopRecordingProp]);

  return (
    <GeneralAudioBtn
      type="button"
      variant={disabled ? 'outline' : 'destructive'}
      className={cn(
        'h-fit rounded-full p-1.5',
        {
          'animate-pulse': recording,
        },
        className
      )}
      onClick={handleOnClick}
      disabled={disabled}
    >
      {!recording && <IconMic className="size-4" />}
      {recording && <IconStop className="size-4" />}{' '}
      <span className="sr-only">Record</span>
    </GeneralAudioBtn>
  );
}
