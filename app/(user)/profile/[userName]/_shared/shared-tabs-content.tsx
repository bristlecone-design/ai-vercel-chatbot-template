import type React from 'react';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export default function SharedTabsContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('w-full py-4', className)}>{children}</div>;
}

export function UserProfileTabCard({
  contentClassName,
  withBorder,
  className,
  children,
}: {
  className?: string;
  contentClassName?: string;
  withBorder?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        'relative flex flex-col gap-2 overflow-clip rounded-xl border-none border-border',
        'w-full max-w-full',
        'sm:mx-0',
        {
          'sm:border-2 sm:border-solid': withBorder,
        },
        className
      )}
    >
      <CardContent className={cn('p-0', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

export function UserProfileTabContent({
  className,
  children,
  noItems = false,
}: {
  className?: string;
  children?: React.ReactNode;
  noItems?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex min-h-48 flex-col items-center justify-start gap-4 py-6 transition-colors sm:min-h-72 lg:py-8',
        // {
        //   'bg-tertiary/50 hover:bg-tertiary/80': !noItems,
        // },
        className
      )}
    >
      {children}
    </div>
  );
}

export function UserProfileTabContentHero({
  className,
  authenticated: isAuthenticated,
  children,
}: {
  className?: string;
  authenticated: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-2',
        {
          'sm:max-w-[68%] lg:max-w-[68%]': isAuthenticated,
          'sm:max-w-[58%]': !isAuthenticated,
        },
        className
      )}
    >
      {children}
    </div>
  );
}

export type UserContentDescriptionProps = {
  as?: keyof Pick<JSX.IntrinsicElements, 'div' | 'p'>;
  children?: React.ReactNode;
  className?: string;
};

export function UserContentDescription(props: UserContentDescriptionProps) {
  const { as: Component = 'p', className, children } = props;
  return (
    <Component
      className={cn('flex items-center gap-1.5 text-center', className)}
    >
      {children}
    </Component>
  );
}

export function UserProfileTabContentHeroInnerWithCTA({
  className,
  children,
  header,
  headerClassName,
  description,
  descriptionAs,
  descriptionClassName,
  cta,
}: {
  className?: string;
  children?: React.ReactNode;
  header?: React.ReactNode;
  headerClassName?: string;
  description?: UserContentDescriptionProps['children'];
  descriptionClassName?: UserContentDescriptionProps['className'];
  descriptionAs?: UserContentDescriptionProps['as'];
  cta?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center gap-2.5',
        className
      )}
    >
      {header && (
        <h3
          className={cn(
            'flex flex-col items-center justify-center gap-4 text-lg font-medium sm:gap-2 sm:text-xl',
            headerClassName
          )}
        >
          {header}
        </h3>
      )}
      <div className="flex w-full flex-col items-center justify-center gap-6">
        {description && (
          <UserContentDescription
            as={descriptionAs}
            className={descriptionClassName}
          >
            {description}
          </UserContentDescription>
        )}
        {cta}
      </div>
      {children}
    </div>
  );
}
