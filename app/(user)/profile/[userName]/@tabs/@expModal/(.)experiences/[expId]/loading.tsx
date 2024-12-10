// You can add any UI inside Loading, including a Skeleton.

import { IconSatellite } from '@/components/ui/icons';
import { BlockSkeleton } from '@/components/ui/skeleton';

import { InterceptedExperienceDialog } from './_components/InterceptedExperienceDialog';

// https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
export default function Loading() {
  return (
    <InterceptedExperienceDialog
      open
      isPromptChallenge={false}
      isStorySeries={false}
      headerClassName="flex flex-col-reverse gap-4"
      title={<BlockSkeleton className="h-10 w-full" />}
      description={<BlockSkeleton className="mx-auto h-8 w-3/5" />}
      footerCtaLabel="Going to space 🚀 and back 🌎"
      // className="!animate-none"
    >
      {/* <BlockSkeleton className="absolute inset-0 size-full" /> */}
      <div className="p-4">
        <IconSatellite className="mx-auto size-4/5 animate-pulse text-muted-foreground motion-reduce:animate-none sm:size-[50%]" />
      </div>
    </InterceptedExperienceDialog>
  );
}
