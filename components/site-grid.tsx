import type { RefObject } from 'react';

import { cn } from '@/lib/utils';

export default function SiteGrid({
  containerRef,
  className,
  contentMain,
  contentSide,
  sideFirstOnMobile,
  sideHiddenOnMobile,
}: {
  containerRef?: RefObject<HTMLDivElement>;
  className?: string;
  contentMain: JSX.Element;
  contentSide?: JSX.Element;
  sideFirstOnMobile?: boolean;
  sideHiddenOnMobile?: boolean;
}) {
  return (
    <div
      ref={containerRef}
      className={cn(
        className,
        'grid',
        'grid-cols-1 md:grid-cols-12',
        'gap-x-4 lg:gap-x-6',
        'gap-y-4',
        'max-w-7xl'
      )}
    >
      <div
        className={cn(
          'col-span-1 md:col-span-9',
          sideFirstOnMobile && 'order-2 md:order-none'
        )}
      >
        {contentMain}
      </div>
      {contentSide && (
        <div
          className={cn(
            'col-span-1 md:col-span-3',
            sideFirstOnMobile && 'order-1 md:order-none',
            sideHiddenOnMobile && 'hidden md:block'
          )}
        >
          {contentSide}
        </div>
      )}
    </div>
  );
}
