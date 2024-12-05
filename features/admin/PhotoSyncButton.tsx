import type { ComponentProps } from 'react';
import clsx from 'clsx';

export default function PhotoSyncButton({
  action,
  includeLabel = true,
  onFormSubmit,
  formData: { photoId, photoUrl } = {},
  photoTitle,
  shouldConfirm,
  shouldToast,
}: {
  action: (formData: FormData) => void;
  includeLabel?: boolean;
  formData?: {
    photoId?: string;
    photoUrl?: string;
  };
  photoTitle?: string;
  shouldConfirm?: boolean;
  shouldToast?: boolean;
} & ComponentProps<typeof SubmitButtonWithStatus>) {
  const confirmText =
    'Are you sure you want to overwrite EXIF data ' +
    (photoTitle
      ? `for "${photoTitle}" from source file? `
      : 'from source file? ') +
    'This action cannot be undone.';
  return (
    <FormWithConfirm
      action={action}
      confirmText={shouldConfirm ? confirmText : undefined}
    >
      {photoId && <input name="id" value={photoId} hidden readOnly />}
      {photoUrl && <input name="photoUrl" value={photoUrl} hidden readOnly />}
      <SubmitButtonWithStatus
        title="Update photo from original file"
        icon={
          <IconGrSync
            className={clsx(
              'translate-x-[0.5px] translate-y-[0.5px]',
              includeLabel && 'sm:translate-x-[-0.5px]'
            )}
          />
        }
        onFormSubmitToastMessage={
          shouldToast
            ? photoTitle
              ? `"${photoTitle}" EXIF data synced`
              : 'EXIF data synced'
            : undefined
        }
        onFormSubmit={onFormSubmit}
      >
        {includeLabel ? 'EXIF' : null}
      </SubmitButtonWithStatus>
    </FormWithConfirm>
  );
}
