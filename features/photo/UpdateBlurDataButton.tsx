import { useState } from 'react';
import { clsx } from 'clsx';
import { FiRotateCcw } from 'react-icons/fi';

import { Spinner } from '@/components/spinner';

import { getImageBlurAction } from './actions';

export default function UpdateBlurDataButton({
  photoUrl,
  onUpdatedBlurData,
}: {
  photoUrl?: string;
  onUpdatedBlurData: (blurData: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <button
      type="button"
      className={clsx('flex min-h-9 min-w-[3.25rem] justify-center', 'h-full')}
      disabled={!photoUrl || isLoading}
      onClick={() => {
        if (photoUrl) {
          setIsLoading(true);
          getImageBlurAction(photoUrl)
            .then((blurData) => onUpdatedBlurData(blurData))
            .finally(() => setIsLoading(false));
        }
      }}
    >
      {isLoading ? <Spinner /> : <FiRotateCcw size={18} />}
    </button>
  );
}
