'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { uploadExperienceAudioBlob } from '@/actions/blob';
import { saveExperienceAudioMediaRecord } from '@/actions/media/add-core-media';
import { getExperienceAudioMediaRecord } from '@/actions/media/get-core-media';
import { useAppState } from '@/state/app-state';
import type { SpeechCreateParams } from 'openai/resources/audio/speech';
import { toast } from 'sonner';
import { useIntersectionObserver } from 'usehooks-ts';

import { getErrorMessage } from '@/lib/errors';
import { mapGeneralMediaToAudioMedia } from '@/lib/media/media-utils';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button, type ButtonProps } from '@/components/ui/button';
import { IconPlay, IconSpinner } from '@/components/ui/icons';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BlockSkeleton } from '@/components/ui/skeleton';
import { SharedInfoTooltip } from '@/components/tooltip';

import type { CustomPutBlobResult } from '@/types/blob';
import type { MediaAudio, MediaAudioTextToSpeech } from '@/types/media';

/**
 * Find active audio from list of audio media by voice and language.
 */
function findActiveAudio<R>(
  audioList: MediaAudio[] | MediaAudioTextToSpeech[],
  activeAudioVoice: VoiceModel,
  activeAudioLanguage: string
): R | undefined {
  return audioList.find((media) => {
    return (
      (media.voice === activeAudioVoice &&
        media.language === activeAudioLanguage) ||
      (media.voice === activeAudioVoice && !media.language)
    );
  }) as R;
}

export type VoiceModel = SpeechCreateParams['voice'];

export function VoiceModelSelect({
  disabled,
  activeAudioVoice,
  handleOnValueChange,
}: {
  disabled?: boolean;
  activeAudioVoice: VoiceModel;
  handleOnValueChange: (voice: VoiceModel) => void;
}) {
  return (
    <Select
      value={activeAudioVoice}
      disabled={disabled}
      onValueChange={handleOnValueChange}
    >
      <SelectTrigger className="h-8 w-fit rounded-md px-2 text-xs">
        <SelectValue placeholder="Select a voice" />
      </SelectTrigger>
      <SelectContent className="h-[unset]">
        <SelectGroup>
          {/* <SelectLabel>Fruits</SelectLabel> */}
          <SelectItem value="nova">Feminine</SelectItem>
          <SelectItem value="onyx">Masculine</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function LanguageModelSelect({
  disabled,
  activeAudioLanguage,
  handleOnValueChange,
}: {
  disabled?: boolean;
  activeAudioLanguage: string;
  handleOnValueChange: (language: string) => void;
}) {
  return (
    <Select
      value={activeAudioLanguage}
      disabled={disabled}
      onValueChange={handleOnValueChange}
    >
      <SelectTrigger className="h-8 w-fit rounded-md px-2 text-xs">
        <SelectValue placeholder="Select a language" />
      </SelectTrigger>
      <SelectContent className="h-[unset]">
        <SelectGroup>
          {/* <SelectLabel>Fruits</SelectLabel> */}
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="es">Spanish</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export interface TextToSpeechSimpleProps {
  open?: boolean;
  autoPlayOnOpen?: boolean;
  autoGenerate?: boolean;
  text: string;
  label?: string;
  expId: string;
  expAuthorId?: string;
  audioClassName?: string;
  btnClassName?: string;
  btnVariant?: ButtonProps['variant'];
  btnSize?: ButtonProps['size'];
  iconClassName?: string;
  loginToGenerateMsg?: string;
  triggerbtnId?: string;
  intersectingThreshold?: number;
  handleOnOpenChange?: (nextState: boolean) => void;
}

export function SimpleTextToSpeech({
  open: openProp = false,
  autoPlayOnOpen: autoPlayOnOpenProp = true,
  autoGenerate: autoGenerateProp = false,
  triggerbtnId: triggerbtnIdProp,
  label: labelProp,
  text: textProp,
  audioClassName,
  iconClassName,
  btnClassName,
  btnVariant = 'ghost',
  btnSize = 'off',
  expAuthorId,
  expId,
  loginToGenerateMsg = 'Login to generate audio for this experience',
  intersectingThreshold = 0.3,
  handleOnOpenChange: onOpenChangeProp,
}: TextToSpeechSimpleProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const { isIntersecting, ref: intersectionRef } = useIntersectionObserver({
    threshold: intersectingThreshold,
  });

  const { isAuthenticated, userId } = useAppState();

  const allowToGenerate = isAuthenticated && expAuthorId === userId;

  const [isMounted, setIsMounted] = useState<boolean>(false);

  const [open, setOpen] = useState<boolean>(openProp);

  const [initializedAudio, setInitializedAudio] = useState<boolean>(false);
  const [initializingAudio, setInitializingAudio] = useState<boolean>(false);

  const [generatingAudio, setGeneratingAudio] = useState<boolean>(false);

  const [text, setText] = useState<string>(textProp);

  const [activeAudioUrl, setActiveAudioUrl] = useState<string | undefined>(
    undefined
  );

  const [audioList, setAudioList] = useState<MediaAudioTextToSpeech[]>([]);
  const [activeAudio, setActiveAudio] = useState<MediaAudioTextToSpeech | null>(
    // `exp-audio-media-active-${expId}`,
    null
  );

  const [activeAudioModel, setActiveAudioModel] = useLocalStorage<string>(
    `exp-media-active-model-${expId}`,
    'tts-1-hd'
  );

  const [activeAudioVoice, setActiveAudioVoice] = useLocalStorage<VoiceModel>(
    `exp-media-active-voice-${expId}`,
    'nova'
  );
  const [activeAudioLanguage, setActiveAudioLanguage] = useLocalStorage<string>(
    `exp-media-active-lang-${expId}`,
    'en'
  );
  // if (expId === 'cm1e7vvzh000011c1157gi9cj') {
  //   console.log('activeAudio and audioList', {
  //     activeAudio,
  //     audioList,
  //     activeAudioLanguage,
  //     activeAudioVoice,
  //   });
  // }

  const [message, setMessage] = useState<string | null>(null);

  const audioAuthorId = isAuthenticated ? userId : expAuthorId;

  /**
   * Convenience Flags
   */
  const isSelectedAudioGenerated = Boolean(activeAudio);
  const isTriggerDisabled = generatingAudio || initializingAudio;
  const isGenerateDisabled = isTriggerDisabled || !initializedAudio;
  const noExistingAudioFound = !isSelectedAudioGenerated && !isGenerateDisabled;
  const triggerBtnId = triggerbtnIdProp || `tts-trigger-btn-${expId}`;
  // console.log('***** flags', {
  //   expId,
  //   audioList,
  //   activeAudio,
  //   activeAudioModel,
  //   activeAudioVoice,
  //   activeAudioLanguage,
  //   isSelectedAudioGenerated,
  //   isTriggerDisabled,
  //   isGenerateDisabled,
  //   noExistingAudioFound,
  // });

  /**
   * Generate text to speech audio. Can be for new or existing audio that needs to be regenerated.
   */
  const handleGeneratingTextToSpeech = async (
    lang = activeAudioLanguage,
    voice = activeAudioVoice,
    model = activeAudioModel
  ) => {
    const audioAIText = text;
    // console.log('handleGeneratingTextToSpeech invoked', {
    //   lang,
    //   voice,
    //   model,
    // });

    if (!audioAIText) {
      toast.error('No text to generate audio from');
      return;
    }

    try {
      setGeneratingAudio(true);

      const audioAILanguage = lang;
      const audioAIVoice = voice;
      const audioAIModel = model;

      const tts = new FormData();

      tts.append('text', audioAIText);
      tts.append('model', audioAIModel);
      tts.append('language', activeAudioLanguage);
      tts.append('voice', audioAIVoice);

      // console.log('tts body values to send to /api/tts', {
      //   model: audioAIModel,
      //   language: audioAILanguage,
      //   voice: audioAIVoice,
      // });

      const response = await fetch(
        `/api/tts?cachebuster=${new Date().getMilliseconds()}`,
        {
          method: 'POST',
          body: tts,
          next: {
            revalidate: 0,
          },
        }
      );

      if (response.ok) {
        // Save audio to blob storage and database
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });

        // Save audio to blob storage and database
        const data = new FormData();
        data.append('audio', blob);
        data.append('expId', expId);
        data.append('authorId', audioAuthorId || '');
        data.append('voice', audioAIVoice);
        data.append('language', audioAILanguage);

        const storageUploadRes = await uploadExperienceAudioBlob(data);
        // console.log('**** storageUploadRes', storageUploadRes);

        if (!storageUploadRes || storageUploadRes.error) {
          console.error(
            storageUploadRes.message || 'Error uploading audio to blob storage',
            storageUploadRes
          );
        }

        const storageData = storageUploadRes as CustomPutBlobResult;
        const audioUrl = storageData.url;
        const audioDownloadUrl = storageData.downloadUrl;
        const audioStoragePath = storageData.pathname;

        // Re-retrieve existing audio if it exists
        // We do this to ensure we're not saving duplicate audio records
        const existingAudio = findActiveAudio<MediaAudioTextToSpeech>(
          audioList,
          audioAIVoice,
          audioAILanguage
        );
        const existingAudioId = existingAudio?.id;
        // console.log(
        //   'existingAudio in handleGeneratingText before saving::',
        //   existingAudio
        // );

        const savedTTSAudio = await saveExperienceAudioMediaRecord(
          existingAudioId,
          expId,
          audioUrl,
          audioDownloadUrl,
          'Audio Transcription of Experience Content',
          audioStoragePath,
          audioAIText,
          audioAIModel,
          audioAIVoice,
          audioAILanguage,
          audioAuthorId
        );
        // console.log('**** savedTTSAudio', savedTTSAudio);

        if (savedTTSAudio) {
          const url = URL.createObjectURL(blob);
          setActiveAudioUrl(url);

          const mappedTTSAudio = mapGeneralMediaToAudioMedia(savedTTSAudio);
          setAudioList((prev) => [...prev, mappedTTSAudio]);
          setActiveAudio(mappedTTSAudio);
        }
      } else {
        const { error } = await response.json();
        toast.error(error || 'Error generating audio from text');
      }

      // console.log('savedTTSAudio', { savedTTSAudio, storageData });
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      console.error(
        'Error saving audio to blob storage and database',
        errorMsg
      );
    } finally {
      setGeneratingAudio(false);
    }
  };

  /**
   * Retrieve audio from db if it exists.
   */
  const handleGetAndSetExperienceAudioMediaRecord = async (
    setInitAtEnd = false
  ) => {
    const existingTTSMedia = await getExperienceAudioMediaRecord(
      expId,
      audioAuthorId,
      activeAudioVoice
    );
    // console.log(
    //   'existingTTSMedia in handleGetAndSetExperienceAudioMediaRecord',
    //   {
    //     expId,
    //     activeAudioLanguage,
    //     activeAudioVoice,
    //     existingTTSMedia,
    //     setInitAtEnd,
    //   }
    // );

    if (existingTTSMedia.length) {
      // Set audio list with blob urls
      const audioListWithBlobUrl = await Promise.all(
        existingTTSMedia.map(async (item) => {
          const audioBuffer = await fetch(item.url).then((res) => {
            return res.arrayBuffer();
          });

          const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);

          return mapGeneralMediaToAudioMedia({
            ...item,
            url,
          });
        })
      );

      // Set audio list
      setAudioList(audioListWithBlobUrl);

      const activeAudio = findActiveAudio<MediaAudio>(
        audioListWithBlobUrl,
        activeAudioVoice,
        activeAudioLanguage
      );

      // Set active audio
      if (activeAudio) {
        setActiveAudioUrl(activeAudio.url);
        setActiveAudio(activeAudio);
      }
    }

    if (setInitAtEnd) {
      setInitializedAudio(true);
    }
  };

  /**
   * Play text to speech audio generation.
   *
   * @note if audio is already generated, do not generate again. If it is not generated, generate audio, then play.
   *
   * @note if there's audio, it's initialized on mount. @see useEffect
   */
  const handlePlayingTextToSpeech = async () => {
    // If audio is already generated, do not generate again
    if (!activeAudio && !generatingAudio && text) {
      if (!isAuthenticated) {
        toast.error(loginToGenerateMsg);
        setMessage(loginToGenerateMsg);
        return;
      }

      // Generate audio if it doesn't exist
      if (autoGenerateProp) {
        handleGeneratingTextToSpeech();
      }
    } else {
      audioRef.current?.play();
    }
  };

  /**
   * Handle re-generating audio. Wrapper for generating audio.
   */
  const handleReGeneratingTextToSpeech = async () => {
    if (!isAuthenticated) {
      toast.error(loginToGenerateMsg);
      setMessage(loginToGenerateMsg);
      return;
    }

    if (!allowToGenerate) {
      toast.error('You are not allowed to generate audio for this experience');
      return;
    }

    handleGeneratingTextToSpeech();
  };

  /**
   * Handle changing the active audio voice.
   *
   * @note if the voice is changed, looks up the active audio by voice and language. If not found, generates new audio.
   */
  const handleChangingActiveAudioVoice = async (voice: VoiceModel) => {
    // console.log('handleChangingActiveAudioVoice', voice);
    setActiveAudioVoice(voice);

    const activeAudio = findActiveAudio<MediaAudio>(
      audioList,
      voice,
      activeAudioLanguage
    );

    // If active audio is not found, generate new audio
    if (!activeAudio) {
      setActiveAudio(null);
      setActiveAudioUrl(undefined);
      // handleGeneratingTextToSpeech(activeAudioLanguage, voice);
    } else {
      setActiveAudio(activeAudio);
      setActiveAudioUrl(activeAudio.url);
    }
  };

  /**
   * Handle changing the active audio language.
   *
   * @note if the language is changed, looks up the active audio by voice and language. If not found, generates new audio.
   */
  const handleChangingActiveAudioLanguage = async (
    selectedLanguage: string
  ) => {
    setActiveAudioLanguage(selectedLanguage);

    const activeAudio = findActiveAudio<MediaAudio>(
      audioList,
      activeAudioVoice,
      selectedLanguage
    );

    // If active audio is not found, generate new audio
    if (!activeAudio) {
      setActiveAudio(null);
      setActiveAudioUrl(undefined);
      // handleGeneratingTextToSpeech(selectedLanguage, activeAudioVoice);
    } else {
      setActiveAudio(activeAudio);
      setActiveAudioUrl(activeAudio.url);
    }
  };

  /**
   * Toggle mounted state
   */
  React.useEffect(() => {
    setIsMounted(true);

    return () => {
      setIsMounted(false);
    };
  }, []);

  /**
   * On mount, retrieve audio from db if it exists on mount
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    if (generatingAudio) {
      return;
    }

    if (!isIntersecting) {
      return;
    }

    if (initializingAudio || initializedAudio) {
      return;
    }

    if (isMounted && expId && !activeAudio && text) {
      const initAudioMedia = async () => {
        setInitializingAudio(true);
        await handleGetAndSetExperienceAudioMediaRecord(true);
        setInitializingAudio(false);
      };

      initAudioMedia();
    }
  }, [
    isMounted,
    isIntersecting,
    initializingAudio,
    initializedAudio,
    generatingAudio,
    text,
    activeAudio,
    expId,
  ]);

  /**
   * Toggle popover open state on prop change
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    if (openProp !== open) {
      setOpen(openProp);

      // If openProp is true, generate audio
      if (openProp && autoPlayOnOpenProp) {
        if (!isAuthenticated) {
          setMessage(loginToGenerateMsg);
          return;
        }

        // If audio is already generated, do not generate again - just play
        if (isSelectedAudioGenerated) {
          handlePlayingTextToSpeech();
        }
      }
    }
  }, [
    openProp,
    autoPlayOnOpenProp,
    open,
    isAuthenticated,
    isSelectedAudioGenerated,
  ]);

  return (
    <Popover
      open={open}
      onOpenChange={(nextState: boolean) => {
        setOpen(nextState);
        if (typeof onOpenChangeProp === 'function') {
          onOpenChangeProp(nextState);
        }
        if (nextState === false) {
          setMessage(null);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={triggerBtnId}
          ref={intersectionRef}
          onClick={handlePlayingTextToSpeech}
          size={btnSize}
          variant={btnVariant}
          disabled={isTriggerDisabled}
          className={cn(
            'group/tts-btn gap-1.5 rounded-full p-2 hover:bg-accent/80',
            btnClassName
          )}
        >
          {generatingAudio && (
            <IconSpinner className="size-5 animate-spin text-foreground/80 sm:size-4" />
          )}
          {!generatingAudio && (
            <IconPlay
              className={cn(
                'size-5 sm:size-5',
                'brightness-75 transition duration-150 hover:cursor-pointer group-hover/tts-btn:scale-105 group-hover/tts-btn:brightness-100',
                iconClassName
              )}
            />
          )}
          <span className="sr-only">Convert to Speech</span>
          {labelProp && <span className="text-sm">{labelProp}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        side="top"
        className={cn('w-fit', {
          'min-w-80': generatingAudio,
        })}
      >
        <div className="flex flex-col gap-2">
          {/* Generating TTS Audio */}
          {generatingAudio && <p className="text-sm">Generating AI audio...</p>}

          {/* Login to Generate Message */}
          {message && (!generatingAudio || !activeAudio) && (
            <p className="text-sm">
              {!isAuthenticated && message === loginToGenerateMsg && (
                <Link href="/login" className="link-primary no-underline">
                  {message}
                </Link>
              )}
              {isAuthenticated && message === loginToGenerateMsg && message}
            </p>
          )}

          {/* Audio Player */}

          <div className="flex flex-col gap-2">
            <div className="relative flex w-full gap-2">
              {/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
              <audio
                ref={audioRef}
                autoPlay={!generatingAudio}
                aria-disabled={generatingAudio}
                src={activeAudioUrl || undefined}
                className={cn('', audioClassName)}
                controls
                controlsList="nodownload"
              />
              {/* Generating */}
              {generatingAudio && (
                <BlockSkeleton className="absolute inset-0 size-full" />
              )}
              <SharedInfoTooltip
                title="AI Audio/Voice"
                content="This audio is generated using AI."
              />
            </div>

            <div className="relative flex items-center justify-evenly gap-2 text-xs italic text-muted-foreground/80">
              {/* {!generatingAudio && isSelectedAudioGenerated && (
                <h3>AI Generated</h3>
              )} */}
              {/* {generatingAudio && <BlockSkeleton className="h-3 w-20" />} */}

              <Button
                variant="outline"
                size="xs"
                disabled={isGenerateDisabled}
                onClick={handleReGeneratingTextToSpeech}
                className={cn('rounded-md', {
                  'bg-tertiary text-primary': noExistingAudioFound,
                })}
              >
                {generatingAudio
                  ? 'Generating...'
                  : isSelectedAudioGenerated
                    ? 'Regenerate Audio'
                    : 'Generate Audio (AI)'}
              </Button>

              {/* Voice */}
              <VoiceModelSelect
                activeAudioVoice={activeAudioVoice}
                disabled={generatingAudio || !initializedAudio}
                handleOnValueChange={handleChangingActiveAudioVoice}
              />

              {/* Language */}
              <LanguageModelSelect
                activeAudioLanguage={activeAudioLanguage}
                disabled={generatingAudio || !initializedAudio}
                handleOnValueChange={handleChangingActiveAudioLanguage}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
