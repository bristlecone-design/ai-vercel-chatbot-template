import { forwardRef } from 'react';

import { nanoid } from '@/lib/id';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
}

export const MapCanvas = forwardRef<HTMLDivElement, Props>(
  ({ className }, ref) => (
    <div
      id={`map-canvas-${nanoid()}`}
      ref={ref}
      className={cn('size-full', className)}
    />
  )
);

MapCanvas.displayName = 'MapCanvas';

// export default MapCanvas;
