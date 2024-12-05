'use client';

import Link from 'next/link';
import { useAppState } from '@/state/app-state';
import { FaArrowRight } from 'react-icons/fa';

import PhotoUpload from '../photo/PhotoUpload';

import { PATH_ADMIN_PHOTOS } from '@/config/site-paths';

export default function AdminCTA() {
  const { isUserSignedIn } = useAppState();

  return (
    <div className="flex justify-center pt-4">
      {isUserSignedIn ? (
        <PhotoUpload showUploadStatus={false} />
      ) : (
        <Link href={PATH_ADMIN_PHOTOS} className="button primary">
          <span>Admin Dashboard</span>
          <FaArrowRight size={10} />
        </Link>
      )}
    </div>
  );
}
