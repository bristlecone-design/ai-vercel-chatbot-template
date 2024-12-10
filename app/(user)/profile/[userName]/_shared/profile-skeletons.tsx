import { cn } from '@/lib/utils';
import { BlockSkeleton } from '@/components/ui/skeleton';

export function UserProfileContainerSkeleton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex w-full flex-col gap-12', className)}>
      {children}
    </div>
  );
}

export function UserProfileGeneralSkeleton({
  className,
  mediaClassName,
  children,
  numberOfAssets = 6,
}: {
  className?: string;
  mediaClassName?: string;
  children?: React.ReactNode;
  numberOfAssets?: number;
}) {
  return (
    <div className={cn('flex w-full flex-col justify-around gap-8', className)}>
      <BlockSkeleton
        className={cn('aspect-3/4 size-full rounded-lg', mediaClassName)}
      />

      {children}
    </div>
  );
}

export function UserProfileBannerSkeleton() {
  return (
    <div className="border-1 relative h-48 w-full rounded-none bg-muted sm:rounded-md md:h-56">
      <BlockSkeleton className="size-full" />
      <BlockSkeleton className="absolute -bottom-2.5 left-4 z-10 size-24 rounded-full md:-bottom-8 md:left-8 md:size-28" />
    </div>
  );
}

export function UserProfileTabsSectionSkeleton({
  className,
  numOfExpereinces = 5,
  noTabSelectors = false,
  noTopContent = false,
  noExperiences = false,
}: {
  className?: string;
  numOfExpereinces?: number;
  noTabSelectors?: boolean;
  noTopContent?: boolean;
  noExperiences?: boolean;
}) {
  return (
    <div className={cn('flex w-full flex-col justify-around gap-8', className)}>
      {!noTabSelectors && <UserProfileTabsSelectorsSkeleton />}
      {!noTopContent && <UserProfileTabTopContentSkeleton />}
      {!noExperiences && (
        <UserProfileExperiencesSkeleton expCount={numOfExpereinces} />
      )}
    </div>
  );
}

export function UserProfileTabsSelectorsSkeleton() {
  return (
    <div className="flex w-full justify-around gap-1.5">
      <BlockSkeleton className="h-10 w-full" />
      <BlockSkeleton className="h-10 w-full" />
      <BlockSkeleton className="h-10 w-full" />
    </div>
  );
}

export function UserProfileTabTopContentSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <BlockSkeleton className="h-10 w-10 rounded-full" />
      <BlockSkeleton className="h-8 w-1/5" />
      <BlockSkeleton className="h-8 w-1/5" />
    </div>
  );
}

export function UserProfileTabTopContentWithCTASkeleton({
  noCtaBlock = false,
}: { noCtaBlock?: boolean } = {}) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-6">
      <div className="flex w-full flex-col items-center justify-center gap-3">
        <BlockSkeleton className="h-10 w-10 rounded-full" />
        <BlockSkeleton className="h-6 w-1/5" />
        <div className="flex w-full flex-col items-center justify-center gap-2">
          <BlockSkeleton className="h-6 w-3/5" />
          <BlockSkeleton className="h-6 w-4/5" />
        </div>
      </div>
      {!noCtaBlock && <BlockSkeleton className="h-10 w-1/5" />}
    </div>
  );
}

export function UserProfileExperiencesSkeleton({
  numOfAdditionalSkeletons = 0,
  fullSkeletonWidth = false,
  expCount = 5,
  className,
}: {
  expCount?: number;
  className?: string;
  fullSkeletonWidth?: boolean;
  numOfAdditionalSkeletons?: number;
}) {
  return (
    <div className={cn('flex w-full flex-col gap-4 px-4', className)}>
      {/* Dynamic list of 5 items */}
      {[...Array(expCount)].map((_, index) => (
        <div
          key={`experiences-skeleton-${index}`}
          className="flex gap-4 rounded-lg border border-border p-4"
        >
          <BlockSkeleton className="h-10 w-10 rounded-full" />
          <div className="flex w-full flex-col gap-3">
            <div className="flex justify-between">
              <BlockSkeleton className="h-4 w-1/4" />
              <div className="flex gap-1.5">
                <BlockSkeleton className="size-4" />
                <BlockSkeleton className="size-4" />
              </div>
            </div>
            <BlockSkeleton
              className={cn('h-6 w-2/5', { 'w-full': fullSkeletonWidth })}
            />
            <BlockSkeleton
              className={cn('h-5 w-2/5', { 'w-full': fullSkeletonWidth })}
            />
            <BlockSkeleton
              className={cn('h-5 w-4/5', { 'w-full': fullSkeletonWidth })}
            />
            <div className="flex w-full flex-col gap-3">
              {numOfAdditionalSkeletons > 0 &&
                [...Array(numOfAdditionalSkeletons)].map((_, index) => (
                  <BlockSkeleton
                    key={`additional-skeleton-${index}`}
                    className={cn('h-5 w-1/4', { 'w-full': fullSkeletonWidth })}
                  />
                ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function UserProfileViewSkeleton({
  noExperiences,
  noTabContent,
  noTabSelectors,
  numberOfExperiences = 5,
}: {
  noExperiences?: boolean;
  noTabContent?: boolean;
  noTabSelectors?: boolean;
  numberOfExperiences?: number;
}) {
  return (
    <UserProfileContainerSkeleton>
      <UserProfileBannerSkeleton />
      <div className="flex w-full flex-col gap-8">
        <div className="flex justify-between">
          <BlockSkeleton className="h-8 w-1/2" />
          <BlockSkeleton className="h-8 w-2/5" />
        </div>
        <BlockSkeleton className="h-8 w-4/5" />
        {!noTabSelectors && <UserProfileTabsSelectorsSkeleton />}
        {!noTabContent && <UserProfileTabTopContentSkeleton />}
        {!noExperiences && (
          <UserProfileExperiencesSkeleton expCount={numberOfExperiences} />
        )}
      </div>
    </UserProfileContainerSkeleton>
  );
}

export function UserProfileTabsExerienceSectionSkeleton({
  className,
  children,
  noCtaBlock,
  experienceSkeletonClassName,
  numberOfExperiences = 5,
}: {
  className?: string;
  children?: React.ReactNode;
  numberOfExperiences?: number;
  experienceSkeletonClassName?: string;
  noCtaBlock?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex w-full flex-col justify-around gap-8 py-8',
        className
      )}
    >
      <UserProfileTabTopContentWithCTASkeleton noCtaBlock={noCtaBlock} />
      <UserProfileExperiencesSkeleton
        expCount={numberOfExperiences}
        className={experienceSkeletonClassName}
      />
      {children}
    </div>
  );
}

export function UserProfileTabsMediaSectionSkeleton({
  className,
  mediaClassName,
  children,
  numberOfAssets = 6,
}: {
  className?: string;
  mediaClassName?: string;
  children?: React.ReactNode;
  numberOfAssets?: number;
}) {
  return (
    <div
      className={cn(
        'flex w-full flex-col justify-around gap-8 py-8',
        className
      )}
    >
      <UserProfileTabTopContentWithCTASkeleton />
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: numberOfAssets }).map((_, index) => {
          return (
            <BlockSkeleton
              key={`skeleton-item-${index}`}
              className={cn('aspect-3/4 size-full rounded-lg', mediaClassName)}
            />
          );
        })}
      </div>
      {children}
    </div>
  );
}

export function UserProfileTabsDiscoveriesSectionSkeleton({
  className,
  mediaClassName,
  children,
}: {
  className?: string;
  mediaClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex w-full flex-col justify-around gap-8 py-8',
        className
      )}
    >
      <UserProfileTabTopContentWithCTASkeleton />
      {children}
    </div>
  );
}
