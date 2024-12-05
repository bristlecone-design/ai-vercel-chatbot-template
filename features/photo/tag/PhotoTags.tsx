import { Fragment } from 'react';
import PhotoTag from '@/tag/PhotoTag';

import { EntityLinkExternalProps } from '@/components/primitives/EntityLink';

import { isTagFavs } from '.';
import FavsTag from './FavsTag';

export default function PhotoTags({
  tags,
  contrast,
  prefetch,
}: {
  tags: string[];
} & EntityLinkExternalProps) {
  return (
    <div className="flex flex-col">
      {tags.map((tag) => (
        <Fragment key={tag}>
          {isTagFavs(tag) ? (
            <FavsTag {...{ contrast, prefetch }} />
          ) : (
            <PhotoTag {...{ tag, contrast, prefetch }} />
          )}
        </Fragment>
      ))}
    </div>
  );
}
