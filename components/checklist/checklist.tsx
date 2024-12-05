import { ReactNode } from 'react';
import { clsx } from 'clsx';

import { Badge } from '@/components/ui/badge';
import ExperimentalBadge from '@/components/experimental-badge';

export default function Checklist({
  title,
  icon,
  optional,
  experimental,
  children,
}: {
  title: string;
  icon?: ReactNode;
  optional?: boolean;
  experimental?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <div
        className={clsx(
          'inline-flex items-center',
          'text-gray-600 dark:text-gray-300',
          'mb-3 pl-[18px] text-lg'
        )}
      >
        <span className="w-7 shrink-0">{icon}</span>
        <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {title}
          {optional && <Badge>Optional</Badge>}
          {experimental && <ExperimentalBadge />}
        </span>
      </div>
      <div
        className={clsx(
          'bg-white dark:bg-black',
          'dark:text-gray-400',
          'rounded-md border border-gray-200 dark:border-gray-800',
          'divide-y divide-gray-200 dark:divide-gray-800'
        )}
      >
        {children}
      </div>
    </div>
  );
}
