'use client';

import type React from 'react';
import { createContext, useContext, useMemo, useRef, useState } from 'react';
import { useCounter, useInterval } from 'usehooks-ts';

import { transcribeAudioFileFetch } from '@/lib/storage/vercel-blob-fetch';
import { AUDIO_DEFAULTS } from '@/components/audio/audio-constants';

const DEFAULT_COUNTDOWN_START = 3;

export enum AudioSource {
  URL = 'URL',
  FILE = 'FILE',
  RECORDING = 'RECORDING',
}

export type AudioData = {
  buffer: AudioBuffer;
  url: string;
  source: AudioSource;
  mimeType: string;
  transcription?: string;
};

export type AudioPlayerState =
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'canceled'
  | 'recording'
  | 'countdown';

export type AudioProviderCtxType = {
  blob: Blob | null;
  data: AudioData | undefined;
  stream: MediaStream | null;
  transcription: string | null;
  mediaRecorder: MediaRecorder | null;
  state: AudioPlayerState;
  recordingTime: number;
  recordingCountdown: number;
  progress: number | undefined;
  isRecordingModalOpen: boolean;
  isAudioLoading: boolean;
  isAudioRecording: boolean;
  isAudioCanceled: boolean;
  isAudioPlaying: boolean;
  isAudioStopped: boolean;
  isAudioPaused: boolean;
  isAudioCountdown: boolean;
  isAudioTranscribing: boolean;

  startRecording: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  setAudioState: (state: AudioPlayerState) => void;
  setRecordingTime: (time: number) => void;
  showRecordingModal: () => void;
  hideRecordingModal: () => void;
  setAudioFromRecording: (data: Blob) => void;
  resetAudio: () => void;
  cancelAll: () => void;
  setMediaRecorder: (mediaRecorder: MediaRecorder) => void;
};

export const AudioContextDefaultValues: AudioProviderCtxType = {
  blob: null,
  stream: null,
  data: undefined,
  state: 'stopped',
  transcription: null,
  mediaRecorder: null,
  recordingTime: 0,
  recordingCountdown: DEFAULT_COUNTDOWN_START,
  progress: undefined,
  isRecordingModalOpen: false,
  isAudioLoading: false,
  isAudioRecording: false,
  isAudioCanceled: false,
  isAudioStopped: true,
  isAudioPaused: false,
  isAudioPlaying: false,
  isAudioCountdown: false,
  isAudioTranscribing: false,

  // Handlers
  startRecording: () => {},
  stopRecording: () => {},
  pauseRecording: () => {},
  resumeRecording: () => {},
  setRecordingTime: () => {},
  setAudioState: () => {},
  showRecordingModal: () => {},
  hideRecordingModal: () => {},
  setMediaRecorder: () => {},
  resetAudio: () => {},
  cancelAll: () => {},
  setAudioFromRecording: () => {},
};

const AudioProviderCtx = createContext<AudioProviderCtxType>(
  AudioContextDefaultValues
);

export const useAppAudio = () => {
  const ctx = useContext(AudioProviderCtx);

  if (ctx === undefined) {
    throw new Error('useAudio must be used within a AudioProvider');
  }

  return ctx;
};

export type AudioProviderProps = {
  children: React.ReactNode;
  // No countdown by default
  withCountdown?: boolean;
  countdownStart?: number;
  countdownDelay?: number;
  openModalOnRecord?: boolean;
  transcribeOnComplete?: boolean;
  handleOnTranscriptionComplete?: (transcription: string) => void;
  handleOnRecordComplete?: (data: Blob) => void;
  handleOnRecordingEnd?: () => void;
  handleOnRecordingStart?: () => void;
};

export const AudioProvider = ({
  children,
  withCountdown: withCountdownProp = false,
  countdownStart: countdownStartProp = DEFAULT_COUNTDOWN_START,
  countdownDelay: countdownDelayProp = 1000,
  openModalOnRecord: openModalOnRecordProp = false,
  transcribeOnComplete: transcribeOnCompleteProp = false,
  handleOnRecordComplete: handleOnRecordCompleteProp,
  handleOnRecordingStart: handleOnRecordingStartProp,
  handleOnRecordingEnd: handleOnRecordingEndProp,
  handleOnTranscriptionComplete: handleOnTranscriptionCompleteProp,
}: AudioProviderProps) => {
  const audioStreamRef = useRef<MediaStream | null>(null);
  const timeInterval = useRef<number | null>(null);

  const [progress, setProgress] = useState<number | undefined>(undefined);

  const [modalOpen, setModalOpen] = useState(false);

  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );

  const [audioState, setAudioState] =
    useState<AudioProviderCtxType['state']>('stopped');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const [audioData, setAudioData] = useState<AudioData | undefined>(undefined);

  const [audioTranscription, setAudioTranscription] = useState<string | null>(
    null
  );
  const [transcribing, setTranscribing] = useState(false);

  // Countdown timer
  const {
    count: countdown,
    decrement,
    reset: resetCounter,
  } = useCounter(countdownStartProp);

  // Convenience flags
  const isAudioRecording = audioState === 'recording';
  const isAudioCanceled = audioState === 'canceled';
  const isAudioStopped = audioState === 'stopped';
  const isAudioPaused = audioState === 'paused';
  const isAudioPlaying = audioState === 'playing';
  const isAudioCountdown = audioState === 'countdown';

  const isCountdownEnabled = withCountdownProp && Boolean(countdownStartProp);

  const transcribeAudioFile = async (file: Blob | File) => {
    setTranscribing(true);

    const mappedFile = new File([file], 'audio.webm', {
      type: 'audio/webm',
    });

    const results = await transcribeAudioFileFetch(mappedFile);

    setTranscribing(false);

    if (results?.tanscription) {
      const transcription = results.tanscription;
      setAudioTranscription(transcription);

      // Append the transcription to the audio data
      if (audioData) {
        setAudioData({
          ...audioData,
          transcription,
        });
      }

      if (typeof handleOnTranscriptionCompleteProp === 'function') {
        handleOnTranscriptionCompleteProp(transcription);
      }
    }
  };

  const setAudioFromRecording = async (data: Blob) => {
    handleResettingAudio();
    setProgress(0);

    if (isAudioCanceled) {
      return;
    }

    setAudioBlob(data);

    // Send the recorded audio to the parent component
    if (typeof handleOnRecordCompleteProp === 'function') {
      handleOnRecordCompleteProp(data);
    }

    const blobUrl = URL.createObjectURL(data);
    const fileReader = new FileReader();
    fileReader.onprogress = (event) => {
      setProgress(event.loaded / event.total || 0);
    };
    fileReader.onloadend = async () => {
      const audioCTX = new AudioContext({
        sampleRate: AUDIO_DEFAULTS.SAMPLING_RATE,
      });
      const arrayBuffer = fileReader.result as ArrayBuffer;
      const decoded = await audioCTX.decodeAudioData(arrayBuffer);
      setProgress(undefined);
      setAudioData({
        buffer: decoded,
        url: blobUrl,
        source: AudioSource.RECORDING,
        mimeType: data.type,
      });

      //   setModalOpen(false);
    };
    fileReader.readAsArrayBuffer(data);

    return;
  };

  const handleDataAvailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      setAudioFromRecording(event.data).then(() => {
        if (transcribeOnCompleteProp) {
          transcribeAudioFile(event.data);
        }
      });
    }
  };

  const handleResettingAudio = () => {
    setAudioData(undefined);
    setAudioBlob(null);
    setAudioTranscription(null);
    setAudioState('stopped');
  };

  const handleInitRecordingTimeInterval = () => {
    timeInterval.current = window.setInterval(() => {
      setRecordingTime((prevTime) => prevTime + 1);
    }, 1000);
  };

  const handleResetRecordingTimeInterval = () => {
    if (timeInterval.current) {
      clearInterval(timeInterval.current);
      timeInterval.current = null;
    }
  };

  const handleStartRecording = async () => {
    try {
      if (openModalOnRecordProp) {
        setModalOpen(true);
      }

      if (typeof handleOnRecordingStartProp === 'function') {
        handleOnRecordingStartProp();
      }

      // Reset the audio data
      handleResettingAudio();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioStreamRef.current = stream;
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      recorder.addEventListener('dataavailable', handleDataAvailable);

      setMediaRecorder(recorder);

      // Start the record if countdown is disabled
      if (!isCountdownEnabled) {
        recorder.start();
        setAudioState('recording');
      } else {
        setAudioState('countdown');
        // handleInitRecordingTimeInterval();
      }

      // timeInterval.current = window.setInterval(() => {
      //   setRecordingTime((prevTime) => prevTime + 1);
      // }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      if (typeof handleOnRecordingEndProp === 'function') {
        handleOnRecordingEndProp();
      }
    }
  };

  const handleStopRecording = () => {
    setAudioState('stopped');

    if (typeof handleOnRecordingEndProp === 'function') {
      handleOnRecordingEndProp();
    }

    if (mediaRecorder && isAudioRecording) {
      mediaRecorder.stop();
      setAudioState('stopped');

      //   if (openModalOnRecordProp) {
      //     setModalOpen(false);
      //   }

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timeInterval.current) {
        handleResetRecordingTimeInterval();
      }
      setRecordingTime(0);
      // setMediaRecorder(null);
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorder) {
      setAudioState('paused');
      mediaRecorder.pause();
      handleResetRecordingTimeInterval();

      if (typeof handleOnRecordingEndProp === 'function') {
        handleOnRecordingEndProp();
      }
    }
  };

  const handleResumeRecording = () => {
    if (mediaRecorder) {
      setAudioState('recording');
      mediaRecorder.resume();
      handleInitRecordingTimeInterval();

      if (typeof handleOnRecordingStartProp === 'function') {
        handleOnRecordingStartProp();
      }
    }
  };

  const handleCancelingAll = () => {
    setAudioState('canceled');
    mediaRecorder?.removeEventListener('dataavailable', handleDataAvailable);
    mediaRecorder?.stop();
    setMediaRecorder(null);
    setRecordingTime(0);
    setProgress(undefined);
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (timeInterval.current) {
      clearInterval(timeInterval.current);
      timeInterval.current = null;
    }

    handleResettingAudio();
  };

  const handleShowRecordingModal = () => {
    setModalOpen(true);
  };

  const handleHideRecordingModal = () => {
    setModalOpen(false);
  };

  /**
   * Countdown Recording Timer:
   * - If recording initiated, start the countdown until counter is at 0 then start recording
   */
  useInterval(
    () => {
      // If the countdown is at 1 (not 0), start recording
      if (mediaRecorder && countdown <= 1) {
        setAudioState('recording');
        mediaRecorder.start();
        handleInitRecordingTimeInterval();
        resetCounter();
        return;
      }

      // Decrement the countdown
      decrement();
    },
    // Delay in milliseconds or null to stop it
    isAudioCountdown && mediaRecorder && isCountdownEnabled
      ? countdownDelayProp
      : null
  );

  // Prepare the context value
  const providerValues = useMemo<AudioProviderCtxType>(
    () =>
      ({
        blob: audioBlob,
        data: audioData,
        state: audioState,
        stream: audioStreamRef.current,
        transcription: audioTranscription,
        mediaRecorder,
        recordingTime,
        recordingCountdown: countdown,
        progress,
        isRecordingModalOpen: modalOpen,
        isAudioLoading: progress !== undefined,
        isAudioRecording,
        isAudioPlaying,
        isAudioCanceled,
        isAudioStopped,
        isAudioPaused,
        isAudioCountdown,
        isAudioTranscribing: transcribing,

        startRecording: handleStartRecording,
        stopRecording: handleStopRecording,
        pauseRecording: handlePauseRecording,
        resumeRecording: handleResumeRecording,
        setRecordingTime: setRecordingTime,
        setAudioState: setAudioState,
        showRecordingModal: handleShowRecordingModal,
        hideRecordingModal: handleHideRecordingModal,
        setMediaRecorder: setMediaRecorder,
        resetAudio: handleResettingAudio,
        cancelAll: handleCancelingAll,
        setAudioFromRecording: setAudioFromRecording,
      }) satisfies AudioProviderCtxType,
    [
      audioBlob,
      audioData,
      audioState,
      modalOpen,
      progress,
      countdown,
      recordingTime,
      mediaRecorder,
      isAudioRecording,
      isAudioCanceled,
      isAudioStopped,
      isAudioPaused,
      isAudioCountdown,
      isAudioPlaying,
      setAudioFromRecording,
    ]
  );

  return (
    <AudioProviderCtx.Provider value={providerValues}>
      {children}
    </AudioProviderCtx.Provider>
  );
};
