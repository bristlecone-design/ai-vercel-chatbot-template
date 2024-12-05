'use client';

import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { BiCopy } from 'react-icons/bi';
import { PiXLogo } from 'react-icons/pi';
import { TbPhotoShare } from 'react-icons/tb';
import { toast } from 'sonner';

import { generateXPostText } from '@/lib/social';
import { shortenUrl } from '@/lib/urls';
import { cn } from '@/lib/utils';
import Modal from '@/components/animations/animated-modal';

import { Button } from './ui/button';

import { SHOW_SOCIAL } from '@/config/site-settings';

export default function SharePhotoModal({
  title,
  pathShare,
  pathClose,
  socialText,
  children,
}: {
  title?: string;
  pathShare: string;
  pathClose: string;
  socialText: string;
  children: ReactNode;
}) {
  const renderIcon = (
    icon: JSX.Element,
    action: () => void,
    embedded?: boolean
  ) => (
    <Button
      className={cn(
        'px-3.5 py-3',
        embedded ? 'border-l' : 'rounded-md border',
        'border-gray-200 bg-gray-50 active:bg-gray-100',
        // eslint-disable-next-line max-len
        'dark:border-gray-800 dark:bg-gray-900/75 dark:hover:bg-gray-800/75 dark:active:bg-gray-900',
        'cursor-pointer'
      )}
      onClick={action}
    >
      {icon}
    </Button>
  );

  return (
    <Modal onClosePath={pathClose}>
      <div className="w-full space-y-3 md:space-y-4">
        {title && (
          <div
            className={clsx(
              'flex items-center gap-x-3',
              'text-2xl leading-snug'
            )}
          >
            <TbPhotoShare size={22} className="xs:block hidden" />
            <div className="grow">{title}</div>
          </div>
        )}
        {children}
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              'rounded-md',
              'w-full overflow-hidden',
              'flex items-center justify-stretch',
              'border border-gray-200 dark:border-gray-800'
            )}
          >
            <div className="w-full truncate p-2">{shortenUrl(pathShare)}</div>
            {renderIcon(
              <BiCopy size={18} />,
              () => {
                navigator.clipboard.writeText(pathShare);
                toast('Link to photo copied');
              },
              true
            )}
          </div>
          {SHOW_SOCIAL &&
            renderIcon(<PiXLogo size={18} />, () =>
              window.open(generateXPostText(pathShare, socialText), '_blank')
            )}
        </div>
      </div>
    </Modal>
  );
}
