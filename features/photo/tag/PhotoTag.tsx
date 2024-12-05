import { FaTag } from 'react-icons/fa';

import EntityLink, {
  EntityLinkExternalProps,
} from '@/components/primitives/EntityLink';

import { formatTag } from '.';

import { pathForTag } from '@/config/site-paths';

export default function PhotoTag({
  tag,
  type,
  badged,
  contrast,
  prefetch,
  countOnHover,
}: {
  tag: string;
  countOnHover?: number;
} & EntityLinkExternalProps) {
  return (
    <EntityLink
      label={formatTag(tag)}
      href={pathForTag(tag)}
      icon={<FaTag size={11} className="translate-y-[1px]" />}
      type={type}
      badged={badged}
      contrast={contrast}
      prefetch={prefetch}
      hoverEntity={countOnHover}
    />
  );
}
