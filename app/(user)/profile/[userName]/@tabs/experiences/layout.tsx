import type React from 'react';

import type { ProfilePageProps } from '../../_shared/profile-page-types';

// https://nextjs.org/docs/canary/app/building-your-application/rendering/partial-prerendering
// export const experimental_ppr = true;

type ExperienceSlotLayoutProps = ProfilePageProps & {
  modal: React.ReactNode;
};

export default async function Layout(props: ExperienceSlotLayoutProps) {
  // const params = await props.params;

  // console.log(`**** props in experiences layout`, {
  //   children,
  // });
  // const userName = (await props.params).userName;

  // const profileData =
  //   await getAndVerifyUserProfileDataAccessByUsername(userName);
  // const {
  //   userProfile,
  //   profileUserFirstName,
  //   profileUserLastName,
  //   profileDisplayName,
  //   authUser,
  //   isAuthenticated,
  //   isAuthUserOwnProfile,
  // } = profileData;

  // const userCompletedPromptChallenges = await getCachedUserAllCompletedPrompts(
  //   userProfile.id
  // );

  // const userIncompletePromptChallenges = await getCachedUserIncompletePrompts(
  //   userProfile.id
  // );

  const { children } = props;

  return (
    // <PromptProvider
    //   userSession={authUser}
    //   userPrompts={userIncompletePromptChallenges}
    //   userCompletedPrompts={userCompletedPromptChallenges}
    // >
    children
    // </PromptProvider>
  );
}
