import Link from 'next/link';
import AdminCTA from '@/features/admin/AdminCTA';
import { clsx } from 'clsx';
import { HiOutlinePhotograph } from 'react-icons/hi';

import SiteChecklist from '@/components/checklist/site-checklist';
import { InfoBlock } from '@/components/info-block';
import SiteGrid from '@/components/site-grid';

import { PATH_ADMIN_CONFIGURATION } from '@/config/site-paths';
import { IS_SITE_READY } from '@/config/site-settings';

export default function PhotosEmptyState() {
  return (
    <SiteGrid
      contentMain={
        <InfoBlock
          className="min-h-[20rem] px-8 sm:min-h-[30rem]"
          padding="loose"
        >
          <HiOutlinePhotograph className="text-medium" size={24} />
          <div
            className={clsx(
              'text-2xl font-bold',
              'text-gray-700 dark:text-gray-200'
            )}
          >
            {!IS_SITE_READY ? 'Finish Setup' : 'Setup Complete!'}
          </div>
          {!IS_SITE_READY ? (
            <SiteChecklist simplifiedView />
          ) : (
            <div className="max-w-md space-y-6 text-center">
              <div className="space-y-2">
                <div>Add your first photo:</div>
                <AdminCTA />
              </div>
              <div>
                Change the name of this blog and other configuration by editing
                environment variables referenced in{' '}
                <Link
                  href={PATH_ADMIN_CONFIGURATION}
                  className="text-main hover:underline"
                >
                  /admin/configuration
                </Link>
              </div>
            </div>
          )}
        </InfoBlock>
      }
    />
  );
}
