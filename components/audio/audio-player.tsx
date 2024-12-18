import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

export default function AudioPlayer({
  className,
  audioClassName,
  ...props
}: {
  audioUrl: string;
  mimeType: string;
  className?: string;
  audioClassName?: string;
}) {
  const audioPlayer = useRef<HTMLAudioElement>(null);
  const audioSource = useRef<HTMLSourceElement>(null);

  // Updates src when url changes
  useEffect(() => {
    if (audioPlayer.current && audioSource.current) {
      audioSource.current.src = props.audioUrl;
      audioPlayer.current.load();
    }
  }, [props.audioUrl]);

  return (
    <div
      className={cn(
        'relative z-10 flex w-full min-w-44 sm:min-w-80',
        className
      )}
    >
      <audio
        ref={audioPlayer}
        controls
        className={cn(
          'h-8 w-full rounded-md shadow-black/5 ring-1',
          audioClassName
        )}
      >
        <source ref={audioSource} type={props.mimeType} />
      </audio>
    </div>
  );
}
