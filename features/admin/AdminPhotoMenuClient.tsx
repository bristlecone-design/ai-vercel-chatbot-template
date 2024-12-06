'use client';

import { useMemo, type ComponentProps } from 'react';
import { usePathname } from 'next/navigation';
import { useAppState } from '@/state/app-state';
import { BiTrash } from 'react-icons/bi';
import { FaRegEdit, FaRegStar, FaStar } from 'react-icons/fa';

import { deleteConfirmationTextForPhoto } from '../photo';
import { deletePhotoAction, toggleFavoritePhotoAction } from '../photo/actions';
import type { RevalidatePhoto } from '../photo/InfinitePhotoScroll';
import { isPathFavs, isPhotoFav } from '../photo/tag';

import type { Photo } from '@/types/photo';
import { pathForAdminPhotoEdit, pathForPhoto } from '@/config/site-paths';

export default function AdminPhotoMenuClient({
  photo,
  revalidatePhoto,
  includeFavorite = true,
  ...props
}: Omit<ComponentProps<typeof MoreMenu>, 'items'> & {
  photo: Photo;
  revalidatePhoto?: RevalidatePhoto;
  includeFavorite?: boolean;
}) {
  const { isUserSignedIn, registerAdminUpdate } = useAppState();

  const isFav = isPhotoFav(photo);
  const path = usePathname();
  const shouldRedirectFav = isPathFavs(path) && isFav;
  const shouldRedirectDelete = pathForPhoto({ photo: photo.id }) === path;

  const favIconClass = 'translate-x-[-1.5px] translate-y-[0.5px]';

  const items = useMemo(() => {
    const items: MoreMenuItem[] = [
      {
        label: 'Edit',
        icon: <FaRegEdit size={14} />,
        href: pathForAdminPhotoEdit(photo.id),
      },
    ];
    if (includeFavorite) {
      items.push({
        label: isFav ? 'Unfavorite' : 'Favorite',
        icon: isFav ? (
          <FaStar size={14} className={`text-amber-500 ${favIconClass}`} />
        ) : (
          <FaRegStar size={14} className={favIconClass} />
        ),
        action: () =>
          toggleFavoritePhotoAction(photo.id, shouldRedirectFav).then(() =>
            revalidatePhoto?.(photo.id)
          ),
      });
    }
    items.push({
      label: 'Delete',
      icon: <BiTrash size={15} className="translate-x-[-1.5px]" />,
      action: () => {
        if (confirm(deleteConfirmationTextForPhoto(photo))) {
          return deletePhotoAction(
            photo.id,
            photo.url,
            shouldRedirectDelete
          ).then(() => {
            revalidatePhoto?.(photo.id, true);
            registerAdminUpdate?.();
          });
        }
      },
    });
    return items;
  }, [
    photo,
    includeFavorite,
    isFav,
    shouldRedirectFav,
    revalidatePhoto,
    shouldRedirectDelete,
    registerAdminUpdate,
  ]);

  return isUserSignedIn ? (
    <MoreMenu
      {...{
        items,
        ...props,
      }}
    />
  ) : null;
}
