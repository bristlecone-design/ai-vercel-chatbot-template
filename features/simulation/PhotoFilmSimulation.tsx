import EntityLink, {
  type EntityLinkExternalProps,
} from '@/components/primitives/EntityLink';

import type { FilmSimulation } from '.';
import { labelForFilmSimulation } from '../photo/vendors/fujifilm';
import PhotoFilmSimulationIcon from './PhotoFilmSimulationIcon';

import { pathForFilmSimulation } from '@/config/site-paths';

export default function PhotoFilmSimulation({
  simulation,
  type = 'icon-last',
  badged = true,
  contrast = 'low',
  prefetch,
  countOnHover,
}: {
  simulation: FilmSimulation;
  countOnHover?: number;
} & EntityLinkExternalProps) {
  const { small, medium, large } = labelForFilmSimulation(simulation);

  return (
    <EntityLink
      label={medium}
      labelSmall={small}
      href={pathForFilmSimulation(simulation)}
      icon={<PhotoFilmSimulationIcon simulation={simulation} />}
      title={`Film Simulation: ${large}`}
      type={type}
      badged={badged}
      contrast={contrast}
      prefetch={prefetch}
      hoverEntity={countOnHover}
      iconWide
    />
  );
}
