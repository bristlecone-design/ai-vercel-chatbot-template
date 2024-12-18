'use client';

import {
  AudioProvider,
  useAppAudio,
  type AudioProviderProps,
} from '@/state/app-audio-provider';

import { cn } from '@/lib/utils';

import { IconCircleX, IconMaximize } from '../ui/icons';
import AudioPlayer from './audio-player';
import { AudioRecorder } from './audio-recorder';
import { GeneralAudioBtn, RecordAudioBtn } from './audio-recorder-btns';
import { AudioRecorderDrawer } from './audio-recorder-drawer';
import {
  LiveAudioVisualizer,
  type LiveAudioVisualizerProps,
} from './audio-visualizer';

export enum AudioSource {
  URL = 'URL',
  FILE = 'FILE',
  RECORDING = 'RECORDING',
}

export interface AudioManagerVisualizerProps
  extends Pick<
    LiveAudioVisualizerProps,
    | 'gap'
    | 'width'
    | 'height'
    | 'barWidth'
    | 'barColor'
    | 'fftSize'
    | 'smoothingTimeConstant'
  > {
  className?: string;
}

export function AudioManagerVisualizer(props: AudioManagerVisualizerProps) {
  const { mediaRecorder } = useAppAudio();

  if (!mediaRecorder) {
    return null;
  }

  const {
    className,
    gap = 2,
    width = 125,
    height = 56,
    barWidth = 1.5,
    barColor = 'rgb(96, 165, 250)',
    fftSize = 1024,
    smoothingTimeConstant = 0.8,
  } = props;

  return (
    <LiveAudioVisualizer
      gap={gap}
      width={width}
      height={height}
      barWidth={barWidth}
      barColor={barColor}
      // backgroundColor={'rgb(15, 23, 42)'}
      fftSize={fftSize}
      smoothingTimeConstant={smoothingTimeConstant}
      mediaRecorder={mediaRecorder}
      className={cn('h-7 min-w-full', className)}
    />
  );
}

export interface AudioManagerRecordBtnProps {
  disabled?: boolean;
}

export function AudioManagerRecordBtn({
  disabled,
}: AudioManagerRecordBtnProps) {
  const {
    isAudioRecording,
    isAudioTranscribing,
    startRecording,
    stopRecording,
  } = useAppAudio();

  return (
    <RecordAudioBtn
      key={`record-audio-btn-${isAudioRecording}`}
      recording={isAudioRecording}
      disabled={disabled || isAudioTranscribing}
      onClick={() => (isAudioRecording ? stopRecording() : startRecording())}
    />
  );
}

export interface AudioManagerRecorderDrawerProps {
  className?: string;
}

export function AudioManagerRecorderDrawer({
  className,
}: AudioManagerRecorderDrawerProps) {
  const {
    isAudioRecording,
    isRecordingModalOpen,
    hideRecordingModal,
    // setAudioFromRecording,
  } = useAppAudio();

  const handleDrawerClose = () => {
    hideRecordingModal();
  };

  if (!isRecordingModalOpen) {
    return null;
  }

  return (
    <AudioRecorderDrawer
      open={isRecordingModalOpen}
      title={isAudioRecording ? 'Recording Audio Chat' : 'Record Audio Chat'}
      handleOnClose={handleDrawerClose}
      handleOnSubmit={() => {}}
      className={className}
    >
      <AudioRecorder />
    </AudioRecorderDrawer>
  );
}

export interface AudioManagerControlsProps {
  noAudioVisualizer?: boolean;
  noAudioRecordBtn?: boolean;
  noAudioCancelBtn?: boolean;
  noAudioMaximizeBtn?: boolean;
}

export function AudioManagerCoreControls({
  noAudioVisualizer = false,
  noAudioRecordBtn = false,
  noAudioCancelBtn = false,
  noAudioMaximizeBtn = false,
}: AudioManagerControlsProps) {
  const {
    data: audioData,
    isAudioRecording,
    startRecording,
    stopRecording,
    showRecordingModal,
    cancelAll,
  } = useAppAudio();

  const handleCancelingRecording = () => {
    // if (isAudioRecording) {
    //   stopRecording();
    // }
    cancelAll();
  };

  return (
    <div className="flex items-center justify-end gap-4">
      {!noAudioVisualizer && <AudioManagerVisualizer className="" />}

      {!noAudioCancelBtn && audioData && !isAudioRecording && (
        <GeneralAudioBtn
          onClick={handleCancelingRecording}
          className="text-destructive/80 transition-colors hover:text-destructive"
        >
          <IconCircleX />
          <span className="sr-only">Cancel</span>
        </GeneralAudioBtn>
      )}

      {!noAudioMaximizeBtn && (audioData || isAudioRecording) && (
        <GeneralAudioBtn
          onClick={showRecordingModal}
          className="text-destructive/80 transition-colors hover:text-destructive"
        >
          <IconMaximize />
          <span className="sr-only">Maximize (Modal)</span>
        </GeneralAudioBtn>
      )}

      {!noAudioRecordBtn && (
        <AudioManagerRecordBtn key={`audio-record-btn-${isAudioRecording}`} />
      )}
    </div>
  );
}

export interface AudioManagerProps extends AudioManagerControlsProps {
  // transcriber: Transcriber;
  noAudioPlayer?: boolean;
  audioPlayerClassName?: string;
  audioPlayerElClassName?: string;
}

export function AudioManager({
  noAudioPlayer = false,
  noAudioVisualizer = false,
  noAudioRecordBtn = false,
  audioPlayerClassName,
  audioPlayerElClassName,
}: AudioManagerProps) {
  const { data: audioData, isAudioCanceled } = useAppAudio();

  return (
    <div className="flex w-full justify-end gap-2">
      {/* Play Controls with Audio Data */}
      {!noAudioPlayer && audioData && !isAudioCanceled && (
        <div className="flex items-center justify-end gap-2">
          <AudioPlayer
            audioUrl={audioData.url}
            mimeType={audioData.mimeType}
            className={audioPlayerClassName}
            audioClassName={audioPlayerElClassName}
          />
        </div>
      )}

      <AudioManagerCoreControls
        noAudioVisualizer={noAudioVisualizer}
        noAudioRecordBtn={noAudioRecordBtn}
      />

      {/* Recording Drawer */}
      <AudioManagerRecorderDrawer />
    </div>
  );
}

export function WithAudioProvider({
  children,
  ...providerProps
}: AudioProviderProps) {
  return <AudioProvider {...providerProps}>{children}</AudioProvider>;
}

export function WithAudioRecorder(props: Omit<AudioProviderProps, 'children'>) {
  return (
    <WithAudioProvider {...props}>
      <AudioManager />
    </WithAudioProvider>
  );
}
