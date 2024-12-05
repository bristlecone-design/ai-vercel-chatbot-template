import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

import { photoLabelForCount } from '../photo';
import { isTagFavs } from '../photo/tag';
import FavsTag from '../photo/tag/FavsTag';
import PhotoTag from '../photo/tag/PhotoTag';

export default function AdminTagBadge({
  tag,
  count,
  hideBadge,
}: {
  tag: string;
  count: number;
  hideBadge?: boolean;
}) {
  const renderBadgeContent = () => (
    <div
      className={cn(
        'inline-flex items-center gap-2',
        // Fix nested EntityLink-in-Badge quirk for tags
        '[&>*>*:first-child]:items-center'
      )}
    >
      {isTagFavs(tag) ? <FavsTag /> : <PhotoTag {...{ tag }} />}
      <div className="text-dim uppercase">
        <span>{count}</span>
        <span className="xs:inline-block hidden">
          &nbsp;
          {photoLabelForCount(count)}
        </span>
      </div>
    </div>
  );

  return hideBadge ? (
    renderBadgeContent()
  ) : (
    <Badge className="!py-[3px]">{renderBadgeContent()}</Badge>
  );
}
