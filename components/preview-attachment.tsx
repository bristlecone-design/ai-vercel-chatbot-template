'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

import { LoaderIcon } from './icons';
import { Button } from './ui/button';
import { IconAudioLines, IconCircleX } from './ui/icons';

import type { MediaAttachment } from '@/types/media';

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
  allowRemove = false,
  handleOnRemove,
}: {
  attachment: MediaAttachment;
  isUploading?: boolean;
  allowRemove?: boolean;
  handleOnRemove?: (attachment: MediaAttachment) => void;
}) => {
  const { name, url, contentType } = attachment;

  const [deleted, setDeleted] = useState(false);

  const isImageType = contentType?.startsWith('image');
  const isAudioType = contentType?.startsWith('audio');
  console.log('attachment in preview component', {
    attachment,
    isImageType,
    isAudioType,
    contentType,
  });

  return (
    <div className="relative flex flex-col gap-2">
      <div className="relative flex aspect-video w-20 flex-col items-center justify-center rounded-md bg-muted backdrop-blur-sm">
        {contentType ? (
          isImageType ? (
            // NOTE: it is recommended to use next/image for images
            // eslint-disable-next-line @next/next/no-img-element
            <motion.img
              key={`${url}-${deleted}`}
              src={url}
              alt={name ?? 'An image attachment'}
              className="size-full rounded-md object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: deleted ? 0 : 1 }}
              exit={{ opacity: 0 }}
            />
          ) : isAudioType ? (
            <Button variant="ghost" className="p-1">
              <IconAudioLines className="size-full" />
            </Button>
          ) : (
            <div className="" />
          )
        ) : (
          <div className="" />
        )}

        {(isUploading || deleted) && (
          <div className="absolute animate-spin text-zinc-500">
            <LoaderIcon />
          </div>
        )}
      </div>
      <div className="max-w-16 truncate text-xs text-zinc-500">{name}</div>

      {allowRemove && (
        <div className="absolute -right-2 -top-2.5">
          <Button
            size="off"
            type="button"
            variant="secondary"
            className="h-fit rounded-full p-0.5"
            onClick={() => {
              setDeleted(true);
              handleOnRemove?.(attachment);
            }}
          >
            <IconCircleX />
          </Button>
        </div>
      )}
    </div>
  );
};
