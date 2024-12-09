'use client';

import React from 'react';

import { isYouTubeEmbedUrl } from '@/lib/media/media-utils';

import { GeneralDrawer } from '../drawer-general';
import { Button } from '../ui/button';
import { IconPlay } from '../ui/icons';

export function VideoDrawer({
  src,
  caption,
  description,
  title = 'Video',
  footerCloseLabel = 'Close',
}: {
  src: string;
  title?: React.ReactNode;
  description?: string | null;
  caption?: string | null;
  footerCloseLabel?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleOnClose = () => {
    setIsOpen(false);
  };

  const handleOnToggle = () => {
    setIsOpen((current) => !current);
  };

  const isYouTubeEmbed = isYouTubeEmbedUrl(src);

  return (
    <React.Fragment>
      <Button
        variant="plain"
        size="off"
        onClick={handleOnToggle}
        className="size-10 rounded-full border-2 border-foreground/80 bg-background/5 p-2 hover:border-foreground hover:bg-background/30"
      >
        <IconPlay className="size-full" />
      </Button>
      {isOpen && (
        <GeneralDrawer
          modal={false}
          dismissible={true}
          open={isOpen}
          title={title}
          content={description}
          titleClassName="justify-center"
          //   contentClassName="aspect-video-landscape-wide"
          footerCtaLabel={footerCloseLabel}
          handleOnClose={handleOnClose}
        >
          {!isYouTubeEmbed && (
            <React.Fragment>
              <video controls className="h-full w-full" src={src} />
            </React.Fragment>
          )}
          {isYouTubeEmbed && (
            <div className="flex size-full flex-col gap-2">
              <iframe
                loading="lazy"
                allowFullScreen
                //   width="560"
                //   height="315"
                title="YouTube video player"
                src="https://www.youtube.com/embed/IRbR5ZLhFz0?si=LaeqKxKkNLZrcYwa"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                className="aspect-video-landscape-wide size-full"
              />
              {caption && (
                <p className="text-center text-sm font-medium text-foreground/80">
                  {caption}
                </p>
              )}
            </div>
          )}
        </GeneralDrawer>
      )}
    </React.Fragment>
  );
}
