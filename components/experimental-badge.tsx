import { clsx } from 'clsx';

import { Badge } from '@/components/ui/badge';

export default function ExperimentalBadge({
  className,
}: {
  className?: string;
}) {
  return (
    <Badge
      className={clsx(
        'text-pink-500 dark:text-white',
        'bg-pink-100 dark:bg-pink-600',
        'pt-0.5',
        className
      )}
    >
      Experimental
    </Badge>
  );
}
