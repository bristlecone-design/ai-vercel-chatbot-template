import { cn } from '@/lib/utils';

export type CommonContainerProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
};

export const CommonContainer = ({
  id,
  className,
  children,
}: CommonContainerProps) => {
  return (
    <div
      id={id}
      className={cn(
        'mx-auto max-w-2xl px-4 lg:max-w-3xl xl:max-w-5xl',
        className
      )}
    >
      {children}
    </div>
  );
};

// Extends base DIV element
export interface ContentContainerProps extends React.HTMLProps<HTMLDivElement> {
  children: React.ReactNode;
}

export const ContentContainer = ({
  className,
  children,
  ...rest
}: ContentContainerProps) => {
  return (
    <div
      className={cn('pb-[200px] sm:pt-4 md:pb-[264px] md:pt-10', className)}
      {...rest}
    >
      {children}
    </div>
  );
};

export function ContentHeroContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center',
        'rounded-md sm:aspect-video-landscape-wide',
        'px-4 py-4 sm:py-8',
        'bg-gradient-to-t',
        'from-blue-500 via-blue-600/80 to-blue-500/90',
        'dark:from-green-800 dark:via-green-700 dark:to-green-700/90',
        'animate-animateBackground',
        className
      )}
    >
      {children}
    </div>
  );
}

export interface PrimaryContentContainerProps extends ContentContainerProps {
  innerContainerClassName?: string;
}

export const PrimaryContentContainer = ({
  className,
  innerContainerClassName,
  children,
  ...rest
}: PrimaryContentContainerProps) => {
  return (
    <ContentContainer className={className} {...rest}>
      <CommonContainer className={innerContainerClassName}>
        {children}
      </CommonContainer>
    </ContentContainer>
  );
};
