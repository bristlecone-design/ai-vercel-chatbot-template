'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { uploadPhotoFromClient } from '@/lib/storage';
import { cn } from '@/lib/utils';

import { PATH_ADMIN_UPLOADS, pathForAdminUploadUrl } from '@/config/site-paths';

export default function PhotoUpload({
  shouldResize,
  onLastUpload,
  showUploadStatus,
  debug,
}: {
  shouldResize?: boolean;
  onLastUpload?: () => Promise<void>;
  showUploadStatus?: boolean;
  debug?: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const [debugDownload, setDebugDownload] = useState<{
    href: string;
    fileName: string;
  }>();

  const router = useRouter();

  return (
    <div className={cn('space-y-4', isUploading && 'cursor-not-allowed')}>
      <div className="flex items-center gap-8">
        <form className="flex min-w-0 items-center">
          <ImageInput
            loading={isUploading}
            shouldResize={shouldResize}
            onStart={() => {
              setIsUploading(true);
              setUploadError('');
            }}
            onBlobReady={async ({
              blob,
              extension,
              hasMultipleUploads,
              isLastBlob,
            }) => {
              if (debug) {
                setDebugDownload({
                  href: URL.createObjectURL(blob),
                  fileName: `debug.${extension}`,
                });
                setIsUploading(false);
                setUploadError('');
              } else {
                return uploadPhotoFromClient(blob, extension)
                  .then(async (url) => {
                    if (isLastBlob) {
                      await onLastUpload?.();
                      if (hasMultipleUploads) {
                        // Redirect to view multiple uploads
                        router.push(PATH_ADMIN_UPLOADS);
                      } else {
                        // Redirect to photo detail page
                        router.push(pathForAdminUploadUrl(url));
                      }
                    }
                  })
                  .catch((error) => {
                    setIsUploading(false);
                    setUploadError(`Upload Error: ${error.message}`);
                  });
              }
            }}
            showUploadStatus={showUploadStatus}
            debug={debug}
          />
        </form>
      </div>
      {debug && debugDownload && (
        <a
          className="block"
          href={debugDownload.href}
          download={debugDownload.fileName}
        >
          Download
        </a>
      )}
      {uploadError && <div className="text-error">{uploadError}</div>}
    </div>
  );
}
