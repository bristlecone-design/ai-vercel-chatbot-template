import Link from 'next/link';
import { UserProfileBannerAndAvatar } from '@/features/profile/user-profile-banner-and-avatar';
import { UserProfileDropdownMenu } from '@/features/profile/user-profile-dropdown-menu';

import { getCachedUserPublicFeaturedImgsCount } from '@/lib/db/queries/media/get-featured-imgs';
import { makeUrlAbsolute, shortenUrl } from '@/lib/urls';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { IconEyeClosed, IconEyeOpen } from '@/components/ui/icons';
import { Prose } from '@/components/prose';
import { SharedInfoTooltip } from '@/components/tooltip';

import { SharedProfileLayoutContainer } from './shared-layouts';
import { getAndVerifyUserProfileDataAccessByUsername } from './shared-profile-data-retriever';

import type { AppUser } from '@/types/next-auth';
import type { USER_PROFILE_MODEL } from '@/types/user';

export type UserPublicProfileViewProps = {
  userName: string;
  userProfile?: USER_PROFILE_MODEL;
  authUser?: AppUser;
  className?: string;
  noShowBio?: boolean;
  noShowInterests?: boolean;
  noShowProfessions?: boolean;
  contentClassName?: string;
  childrenClassName?: string;
  children?: React.ReactNode;
};

export async function UserPublicProfileView({
  userName,
  children,
  className,
  contentClassName,
  childrenClassName,
  noShowBio = false,
  noShowInterests = true,
  noShowProfessions = false,
}: UserPublicProfileViewProps) {
  // console.log(`**** refreshing user profile view`);
  const {
    userProfile,
    isProfilePublic,
    isInPrivateBeta,
    isAuthenticated,
    isAuthUserOwnProfile,
    profileUserFirstName,
    profileUserInterests,
    profileUserProfession,
    profileRelativeUrl,
  } = await getAndVerifyUserProfileDataAccessByUsername(userName);
  // console.log('**** user profile view', {
  //   isProfilePublic,
  //   isInPrivateBeta,
  //   isAuthenticated,
  //   isAuthUserOwnProfile,
  //   profileUserFirstName,
  //   profileUserInterests,
  // });

  const userProfileExperienceUrl = profileRelativeUrl
    ? `${profileRelativeUrl}/experiences`
    : '';

  const userInterests = profileUserInterests as string[];
  const userProfessions = profileUserProfession as string[];

  const userFeaturedAssetsCount = await getCachedUserPublicFeaturedImgsCount(
    userProfile.id
  );

  return (
    <div className={cn('flex w-full flex-col gap-6 sm:gap-10', className)}>
      <UserProfileBannerAndAvatar
        noBannerShimmer
        noBannerUserNameLabel={Boolean(
          !userProfile.url && userProfile.username
        )}
        // noAddyInByline={false}
        editable={isAuthUserOwnProfile}
        userId={userProfile.id}
        userUrl={userProfile.url}
        userAvatar={userProfile.avatar || userProfile.image || ''}
        userBanner={userProfile.banner || ''}
        userName={userProfile.name}
        bannerUserNameLabel={
          userProfile.username ? `@${userProfile.username}` : ''
        }
        bannerUserNameLabelClassName="hidden sm:block"
        profileAddy={userProfile.username}
        profileAddyLabel={
          userProfile.url ? (
            <a
              target="_blank"
              href={makeUrlAbsolute(userProfile.url)}
              className="link-primary"
              rel="noreferrer"
            >
              {shortenUrl(userProfile.url)}
            </a>
          ) : (
            ''
          )
        }
        numSharedAssets={userFeaturedAssetsCount}
      />
      <SharedProfileLayoutContainer
        className={cn('w-full max-w-full', contentClassName)}
      >
        <Prose
          className={cn(
            'w-full max-w-full prose-h2:my-2 prose-img:my-0',
            className
          )}
        >
          <h1 className="flex items-start justify-between gap-2.5 sm:items-center">
            <span className="flex grow flex-col justify-between gap-1.5 sm:flex-row">
              {userProfileExperienceUrl && userProfile.name && (
                <Link
                  href={userProfileExperienceUrl}
                  className="link-primary no-underline hover:no-underline"
                >
                  {userProfile.name}
                </Link>
              )}
              {!userProfileExperienceUrl && userProfile.name}
              <span className="flex items-center gap-1.5 text-xl font-medium text-foreground/90">
                <span>
                  {isInPrivateBeta ? (
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className="sm:hidden">In</span>{' '}
                      <span className="hidden sm:inline">Private</span> Beta
                    </span>
                  ) : (
                    'Beta Waitlist'
                  )}{' '}
                </span>

                <span className="inline-flex items-center">
                  <SharedInfoTooltip
                    title={
                      isInPrivateBeta ? 'In Private Beta' : 'Beta Waitlist'
                    }
                    content={
                      isAuthUserOwnProfile
                        ? isInPrivateBeta
                          ? `You're in the private beta which allows you to discover, create and share experiences.`
                          : 'While we activate your account, you can onboard by updating your profile for a more personalized experience, creating experiences and sharing some of your favorite media.'
                        : `${profileUserFirstName ? profileUserFirstName : 'This account'} is on the beta waitlist.`
                    }
                    triggerClassName="rounded-full p-1.5"
                  />

                  <SharedInfoTooltip
                    title={`Profile Visibility - ${isProfilePublic ? 'Public' : 'Private'}`}
                    content={
                      isAuthUserOwnProfile
                        ? isProfilePublic
                          ? 'Your profile is public and can be viewed by anyone.'
                          : 'Your profile is private and can only be viewed by you.'
                        : isProfilePublic
                          ? `${
                              profileUserFirstName
                                ? `${profileUserFirstName}'s`
                                : 'This'
                            } profile is public and can be viewed by anyone.`
                          : isAuthUserOwnProfile
                            ? 'This profile is private and can only be viewed by you.'
                            : 'This profile is private.'
                    }
                    triggerClassName="rounded-full p-1.5"
                  >
                    {isProfilePublic && <IconEyeOpen className="size-5" />}
                    {!isProfilePublic && <IconEyeClosed className="size-5" />}
                  </SharedInfoTooltip>
                </span>
              </span>
            </span>
            <span className="flex items-center gap-1.5 pt-2 sm:pt-0">
              <UserProfileDropdownMenu editEnabled={isAuthUserOwnProfile} />
            </span>
          </h1>
          {!noShowBio && userProfile.bio && (
            <p
              className={cn('lead', {
                'mb-3': userInterests.length > 0 || userProfessions.length > 0,
              })}
            >
              {userProfile.bio}
            </p>
          )}
          <div className="flex w-full flex-col gap-2">
            {!noShowProfessions && userProfessions?.length > 0 && (
              <div className="w-full">
                <h3 className="sr-only">Professions</h3>
                <ul className="not-prose flex list-none flex-wrap gap-1.5">
                  {userProfessions.map((profession) => (
                    <li key={`user-profile-profession-${profession}`}>
                      <Badge
                        variant="secondary"
                        className="whitespace-nowrap brightness-[0.65] sm:text-sm"
                      >
                        {profession.trim()}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!noShowInterests && userInterests?.length > 0 && (
              <div className="hidden w-full overflow-x-auto sm:block">
                <h3 className="sr-only">Interests</h3>
                {userInterests && typeof userInterests === 'string' ? (
                  <p>{userInterests}</p>
                ) : (
                  <ul className="not-prose flex list-none gap-1.5 sm:flex-wrap">
                    {userInterests.map((interest) => (
                      <li key={`user-profile-interest-${interest}`}>
                        <Badge variant="outline" className="brightness-[0.4]">
                          {interest.trim()}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </Prose>
        <div className={cn('w-full', childrenClassName)}>{children}</div>
      </SharedProfileLayoutContainer>
    </div>
  );
}
