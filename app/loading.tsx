import { IconSpinner } from '@/components/ui/icons';
import { DialogDiscoverSplashScreen } from '@/components/discovery/dialog-discover-splash-screen';

// https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
export default function Loading() {
  return (
    <DialogDiscoverSplashScreen noCloseBtn noContent noRefreshBtn>
      <div className="flex w-full items-center justify-center">
        <IconSpinner className="size-5 animate-spin brightness-50" />
      </div>
    </DialogDiscoverSplashScreen>
  );
}
