import type { ReactNode } from 'react';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import SiteGrid from '@/components/site-grid';
import { Spinner } from '@/components/spinner';

function AdminChildPage({
  backPath,
  backLabel,
  breadcrumb,
  breadcrumbEllipsis,
  accessory,
  isLoading,
  children,
}: {
  backPath?: string;
  backLabel?: string;
  breadcrumb?: ReactNode;
  breadcrumbEllipsis?: boolean;
  accessory?: ReactNode;
  isLoading?: boolean;
  children: ReactNode;
}) {
  return (
    <SiteGrid
      contentMain={
        <div className="space-y-6">
          {(backPath || breadcrumb || accessory) && (
            <div
              className={cn(
                'flex items-center gap-x-2 gap-y-3',
                !breadcrumbEllipsis && 'flex-wrap',
                'min-h-[2.25rem]' // min-h-9 equivalent
              )}
            >
              <div
                className={cn(
                  'flex items-center gap-x-1.5 gap-y-1 sm:gap-x-3',
                  'flex-grow',
                  breadcrumbEllipsis ? 'min-w-0' : 'flex-wrap'
                )}
              >
                {backPath && (
                  <Link href={backPath} className="flex items-center gap-1.5">
                    <FiArrowLeft size={16} />
                    <span className="xs:inline-block hidden">
                      {backLabel || 'Back'}
                    </span>
                  </Link>
                )}
                {breadcrumb && (
                  <>
                    <span>/</span>
                    <Badge
                      className={cn(
                        breadcrumbEllipsis && 'truncate text-ellipsis'
                      )}
                    >
                      {breadcrumb}
                    </Badge>
                  </>
                )}
                {isLoading && <Spinner />}
              </div>
              {accessory && <div>{accessory}</div>}
            </div>
          )}
          <div>{children}</div>
        </div>
      }
    />
  );
}

export default AdminChildPage;
