import Link from 'next/link';

import { cn } from '@/lib/utils';
import {
  IconBadgeDollarSign,
  IconBatteryCharging,
  IconCaravan,
  IconCollaboration,
  IconSparkle,
  IconSunrise,
  IconTentTree,
} from '@/components/ui/icons';

// import './discovery-scrolling-items.css';

export type ScrollItemIconProps = {
  className?: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
};

export function ScrollItemIcon(props: ScrollItemIconProps): JSX.Element {
  const { icon, className, children } = props;
  return <li className={cn('item__icon', className)}>{icon || children}</li>;
}

export type ScrollingItem = {
  icon: React.ReactNode;
  iconClassName?: string;
  className?: string;
  label: string;
  link?: string;
};

export function DiscoverableScrollingItem({
  className,
  icon,
  iconClassName,
  link,
  label,
}: ScrollingItem) {
  const itemLabel = link ? <Link href={link}>{label}</Link> : label;

  return (
    <li
      className={cn(
        'flex cursor-pointer items-center space-x-2 rounded-md border border-border bg-secondary/35 p-5 shadow-md transition-all hover:-translate-y-1 hover:translate-x-1 hover:scale-[1.025] hover:shadow-xl',
        className
      )}
    >
      <div className={cn('item__icon', iconClassName)}>{icon}</div>
      <div className="item__text flex items-center text-center">
        {itemLabel}
      </div>
    </li>
  );
}

const DEFAULT_ITEMS: Array<ScrollingItem> = [
  {
    icon: <IconTentTree />,
    label: 'Outdoor Recreation',
    link: '/register',
  },
  {
    icon: <IconBadgeDollarSign />,
    label: 'Economic Development',
    link: '/register',
  },
  {
    icon: <IconCollaboration />,
    label: 'Collaborations',
    link: '/register',
  },
  {
    icon: <IconSparkle />,
    label: 'Arts & Culture',
    link: '/register',
  },
  {
    icon: <IconTentTree />,
    label: 'Partnerships',
    link: '/register',
  },
  {
    icon: <IconCaravan />,
    label: 'Parks & Trails',
    link: '/register',
  },
  {
    icon: <IconSunrise />,
    label: 'Rural Nevada',
    link: '/register',
  },
  {
    icon: <IconBatteryCharging />,
    label: 'Charging Stations',
    link: '/register',
  },
  {
    icon: <IconTentTree />,
    label: 'Citizen Science',
    link: '/register',
  },
  {
    icon: <IconSparkle />,
    label: 'Knowledge Sharing',
    link: '/register',
  },
];

export type DiscoveryScrollingItemsProps = {
  children?: React.ReactNode;
  items?: Array<ScrollingItem>;
  transparent?: boolean;
  itemClassName?: string;
  itemSingleClassName?: string;
  className?: string;
};

export function DiscoveryScrollingItems(
  props: DiscoveryScrollingItemsProps
): JSX.Element | null {
  const {
    className,
    itemClassName,
    itemSingleClassName,
    transparent = false,
    items = DEFAULT_ITEMS,
  } = props;

  if (!items.length) return null;

  return (
    <div
      className={cn(
        'flex size-full items-center justify-center',
        {
          'bg-background': !transparent,
          'bg-transparent': transparent,
        },
        className
      )}
    >
      <div className="relative w-full max-w-screen-lg overflow-hidden">
        <h3 className="sr-only">Platform Content Areas</h3>
        <p className="sr-only">
          Here&apos;s a list of some but not all of the content areas and themes
          you can discover, experience and share on this platform, notably
          around Nevada and the Great Basin:
        </p>
        <ul
          className={cn(
            'mx-auto grid h-[140px] w-full animate-skew-scroll grid-cols-1 gap-5 sm:grid-cols-2 md:h-[180px]',
            itemClassName
          )}
        >
          {items.map((item, i) => (
            <DiscoverableScrollingItem
              key={i}
              className={itemSingleClassName}
              {...item}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
