// import { getWaitlistCount as getWaitlistCountDb } from '@/actions/user-db';

import {
  DialogDiscoverSplashScreen,
  type DialogDiscoverSplashScreenProps,
} from './dialog-discover-splash-screen';

export async function ExperienceSplashScreen({
  waitlistCount: waitlistCountProp,
  ...rest
}: DialogDiscoverSplashScreenProps) {
  const waitlistCount = waitlistCountProp ? waitlistCountProp : 0; //await getWaitlistCountDb();

  return <DialogDiscoverSplashScreen waitlistCount={waitlistCount} {...rest} />;
}
