import { ReactNode } from 'react';
import { clsx } from 'clsx';

import ExperimentalBadge from '@/components/experimental-badge';
import StatusIcon from '@/components/status-icon';

export default function ChecklistRow({
  title,
  status,
  isPending,
  optional,
  experimental,
  children,
}: {
  title: string;
  status: boolean;
  isPending: boolean;
  optional?: boolean;
  experimental?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={clsx('flex gap-2.5', 'px-4 pb-2.5 pt-2')}>
      <StatusIcon
        type={status ? 'checked' : optional ? 'optional' : 'missing'}
        loading={isPending}
      />
      <div className="flex min-w-0 flex-col">
        <div
          className={clsx(
            'flex flex-wrap items-center gap-2 pb-0.5',
            'font-bold dark:text-gray-300'
          )}
        >
          {title}
          {experimental && (
            <ExperimentalBadge className="translate-y-[-0.5px]" />
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
