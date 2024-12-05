import { TbCone } from 'react-icons/tb';

import EntityLink, {
  type EntityLinkExternalProps,
} from '@/components/primitives/EntityLink';

import { formatFocalLength } from '.';

import { pathForFocalLength } from '@/config/site-paths';

export default function PhotoFocalLength({
  focal,
  type,
  badged,
  contrast,
  prefetch,
  countOnHover,
}: {
  focal: number;
  countOnHover?: number;
} & EntityLinkExternalProps) {
  return (
    <EntityLink
      label={formatFocalLength(focal)}
      href={pathForFocalLength(focal)}
      icon={<TbCone className="rotate-[270deg]" />}
      type={type}
      badged={badged}
      contrast={contrast}
      prefetch={prefetch}
      hoverEntity={countOnHover}
    />
  );
}
