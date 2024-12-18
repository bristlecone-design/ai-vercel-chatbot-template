'use client';

import { useAppAudio } from '@/state/app-audio-provider';

import { cn } from '@/lib/utils';

import { Badge, type BadgeProps } from '../ui/badge';
import { IconMic, IconStop } from '../ui/icons';
import AudioPlayer from './audio-player';
import { GeneralAudioBtn } from './audio-recorder-btns';
import { LiveAudioVisualizer } from './audio-visualizer';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export interface AudioRecordingTimeProps extends BadgeProps {
  className?: string;
}

export function AudioRecordingTime({
  className,
  variant,
}: AudioRecordingTimeProps) {
  const {
    recordingTime,
    isAudioRecording,
    isAudioPaused,
    data: audioData,
  } = useAppAudio();
  const badgeVariant = variant
    ? variant
    : recordingTime
      ? 'secondary'
      : 'outline';

  const formattedRecordingTime = formatTime(recordingTime);
  return (
    <Badge
      key={`audio-recording-time-${badgeVariant}`}
      variant={badgeVariant}
      className={cn('rounded-full text-lg font-medium', className)}
    >
      {isAudioRecording
        ? `Recording: ${formattedRecordingTime}`
        : isAudioPaused
          ? `Paused: ${formattedRecordingTime}`
          : audioData
            ? 'Ready to Record New'
            : 'Ready to Record'}
    </Badge>
  );
}

type Props = {
  className?: string;
};

export function AudioRecorder(props: Props) {
  const {
    mediaRecorder,
    // recordingTime,
    isAudioRecording,
    data: audioData,
    startRecording,
    stopRecording,
  } = useAppAudio();

  if (!mediaRecorder && !audioData) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full flex-col items-center gap-4 p-6">
      <div className="w-full rounded-lg shadow-lg">
        {mediaRecorder && isAudioRecording ? (
          <div className="flex min-h-60 w-full items-center justify-center overflow-hidden rounded-lg p-1">
            <LiveAudioVisualizer
              gap={2}
              width={360}
              height={240}
              barWidth={3.5}
              barColor={'rgb(96, 165, 250)'}
              // backgroundColor={'rgb(15, 23, 42)'}
              fftSize={1024}
              smoothingTimeConstant={0.8}
              mediaRecorder={mediaRecorder}
            />
          </div>
        ) : audioData ? (
          <AudioPlayer
            audioUrl={audioData.url}
            mimeType={audioData.mimeType}
            className="py-8"
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-6">
        <GeneralAudioBtn
          variant="destructive"
          onClick={isAudioRecording ? stopRecording : startRecording}
          className={cn({ 'animate-pulse': isAudioRecording })}
          aria-label={isAudioRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {isAudioRecording && <IconStop className="size-10" />}
          {!isAudioRecording && <IconMic className="size-10" />}
          <span className="sr-only">
            {isAudioRecording ? 'Stop Recording' : 'Start Recording'}
          </span>
        </GeneralAudioBtn>

        <AudioRecordingTime />
      </div>
    </div>
  );
}
