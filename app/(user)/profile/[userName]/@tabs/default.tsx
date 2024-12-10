import type { ProfilePageProps } from '../_shared/profile-page-types';
import { UserProfileTabsSectionSkeleton } from '../_shared/profile-skeletons';

export default async function Default(props: ProfilePageProps) {
  // const searchParams = await props.searchParams;
  // const params = await props.params;
  // // console.log(`**** props in default fallback page tab`, params, searchParams);
  // const session = await getUserSession();
  // // Show the teaser dialog if the user is not logged in
  // if (session?.blocked) {
  //   await signOutAndRedirectAction();
  // }

  // const { userName } = params;
  // const userProfile = await getCachedUserProfileByUsername(userName);

  // if (!userProfile) {
  //   redirect('/lost');
  // }

  return (
    <UserProfileTabsSectionSkeleton className="py-4" numOfExpereinces={2} />
  );
}
