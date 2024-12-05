import { AiFillApple } from 'react-icons/ai';
import { IoMdCamera } from 'react-icons/io';

import EntityLink, {
  type EntityLinkExternalProps,
} from '@/components/primitives/EntityLink';

import { formatCameraText, type Camera } from '.';

import { pathForCamera } from '@/config/site-paths';

export default function PhotoCamera({
  camera,
  hideAppleIcon,
  type = 'icon-first',
  badged,
  contrast,
  prefetch,
  countOnHover,
}: {
  camera: Camera;
  hideAppleIcon?: boolean;
  countOnHover?: number;
} & EntityLinkExternalProps) {
  const isCameraApple = camera.make?.toLowerCase() === 'apple';
  const showAppleIcon = !hideAppleIcon && isCameraApple;

  return (
    <EntityLink
      label={formatCameraText(camera)}
      href={pathForCamera(camera)}
      icon={
        showAppleIcon ? (
          <AiFillApple
            title="Apple"
            className="translate-x-[-0.5px]"
            size={15}
          />
        ) : (
          <IoMdCamera size={12} className="translate-x-[-1px]" />
        )
      }
      type={showAppleIcon && isCameraApple ? 'icon-first' : type}
      badged={badged}
      contrast={contrast}
      prefetch={prefetch}
      hoverEntity={countOnHover}
    />
  );
}
