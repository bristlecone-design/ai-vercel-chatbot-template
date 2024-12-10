'use client';

import { useActionState, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { updateUser } from '@/actions/user';
import { useAppState } from '@/state/app-state';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';

import { shortenUrl } from '@/lib/urls';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconShiftKey, IconSpinner } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  interests,
  MultiSelectCombobox,
  professions,
} from '@/components/combobox';
import { ButtonCta } from '@/components/cta-btn';
import { SharedInfoTooltip } from '@/components/tooltip';

import { saveUserProfileChanges } from './user-profile-actions';

import type { USER_PROFILE_MODEL } from '@/types/user';

export type UserProfileFormProps = {
  userId?: string;
  noTitle?: boolean;
  noSaveBtn?: boolean;
  redirectPath?: string;
  className?: string;
  title?: string;
  inputClassName?: string;
  userProfile?: USER_PROFILE_MODEL;
  formRef?: React.RefObject<HTMLFormElement>;
  handleOnUpdateSuccess?: (user: USER_PROFILE_MODEL) => void;
};

export function UserProfileForm({
  userProfile: userProfileProp,
  noTitle = false,
  noSaveBtn = false,
  inputClassName,
  redirectPath,
  className,
  formRef,
  title = 'Your Profile',
  handleOnUpdateSuccess,
}: UserProfileFormProps) {
  const router = useRouter();
  const currentPath = usePathname();

  const {
    isPreciseLocation,
    userLocation,
    userProfile,
    userSession,
    userDisplayName,
    handleUpdatingAuthUser,
  } = useAppState();
  console.log(`**** userProfile`, userProfile);

  const [result, dispatch] = useActionState(saveUserProfileChanges, undefined);

  const [updating, setUpdating] = useState(false);

  const userId = userProfile?.id;

  const [userName, setUserNameValue] = useState<string>(userDisplayName || '');

  const [userBio, setUserBio] = useState<string>(userProfile?.bio || '');

  const [userEmail, setUserEmailValue] = useState<string>(
    userProfile?.email || ''
  );

  const [userAvatar, setUserAvatar] = useState<string>(
    userProfile?.avatar || userProfile?.image || ''
  );
  // console.log(`**** userAvatar`, userAvatar);

  const [userUrl, setUserUrl] = useState<string>(
    shortenUrl(userProfile?.url || '')
  );

  const [userUrlSocial, setUserUrlSocial] = useState<string>(
    userProfile?.urlSocial || ''
  );

  const [interestValue, setInterestValue] = useState<string>(
    userProfile?.interests?.join(',') || ''
  );
  const interestValueItems = interestValue
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  const [professionValue, setProfessionValue] = useState<string>(
    userProfile?.profession || ''
  );
  const professionValueItems = professionValue
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  const [organizationValue, setOrganizationValue] = useState<string>(
    userProfile?.organization || userProfile?.company || ''
  );

  const [locationValue, setLocationValue] = useState<string>(
    userProfile?.location || ''
  );

  const [publicVisibility, setPublicVisibility] = useState<boolean>(
    userProfile?.public || false
  );

  const showNameToast = (name: string | undefined) => {
    toast.success(`Name Updated: ${name}!`);
  };

  const showBioToast = (bio: string | undefined) => {
    toast.success(`Bio Updated: ${bio ? bio : '(emptied/removed)'}!`);
  };

  const showUrlToast = (value: string | undefined) => {
    toast.success(`URL Updated: ${value}!`);
  };

  const showUrlSocialToast = (value: string | undefined) => {
    toast.success(`Social URL Updated: ${value}!`);
  };

  const showInterestToast = (interests: string | undefined) => {
    toast.success(
      `Interests Updated: ${interests ? interests : '(emptied/removed)'}!`
    );
  };

  const showLocationToast = (desiredLocation: string | undefined) => {
    toast.success(
      `Location Updated: ${desiredLocation ? desiredLocation : '(emptied/removed)'}!`
    );
  };

  const showProfessionToast = (desiredProfession: string | undefined) => {
    toast.success(
      `Profession/Passion Updated: ${desiredProfession ? desiredProfession : '(emptied/removed)'}!`
    );
  };

  const showOrganizationToast = (specifiedOrg: string | undefined) => {
    toast.success(
      `Company/Org Updated: ${specifiedOrg ? specifiedOrg : '(emptied/removed)'}!`
    );
  };

  const showProfileVisibilityToast = (isVisible: boolean) => {
    toast.success(
      `Profile Visibility Updated: ${isVisible ? 'Public' : 'Private'}`
    );
  };

  const updateSourceUserProfileKey = (key: string, value: string | boolean) => {
    if (userProfile) {
      handleUpdatingAuthUser({
        ...userProfile,
        [key]: value,
      } as USER_PROFILE_MODEL);
    }
  };

  const updateUserFieldInDb = async (
    field: string,
    value: string | boolean
  ) => {
    if (userId && field) {
      const { updated, data: updatedUser } = await updateUser(
        userId,
        { [field]: value },
        currentPath
      );
      // Update local state
      if (updated) {
        updateSourceUserProfileKey(field, value);
      }

      // Update parent component
      if (
        updated &&
        updatedUser &&
        typeof handleOnUpdateSuccess === 'function'
      ) {
        handleOnUpdateSuccess(updatedUser);
      }

      if (updated) {
        router.refresh();
      }

      return updated;
    }

    return false;
  };

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || '';
    setUserNameValue(value);
  };

  const onNameBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = (e.target.value || '').trim();
    if (userId && value && value !== userProfile.name) {
      // setUpdating(true);
      showNameToast(value);
      setUserNameValue(value);
      const updated = await updateUserFieldInDb('name', value);
      // setUpdating(false);
      // if (updated) {
      //   updateSourceUserProfileKey('name', value);
      // }
    }
  };

  const onNameKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = (e.currentTarget.value || '').trim();
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (userId && value && value !== userProfile.name) {
        setUpdating(true);
        showNameToast(value);
        setUserNameValue(value);
        const updated = await updateUserFieldInDb('name', value);
        setUpdating(false);
        // if (updated) {
        //   updateSourceUserProfileKey('name', value);
        // }
      }
    }
  };

  const onBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value || '';
    // Trim the value to 140 characters
    if (value.length > 140) {
      e.target.value = value.slice(0, 140);
    }
    setUserBio(value);
  };

  const onBioBlur = async (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const value = (e.target.value || '').trim();
    if (userId && value !== userProfile.bio) {
      // setUpdating(true);
      showBioToast(value);
      setUserBio(value);
      const updated = await updateUserFieldInDb('bio', value);
      // setUpdating(false);
      // if (updated) {
      //   updateSourceUserProfileKey('bio', value);
      // }
    }
  };

  const onBioKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const value = e.currentTarget.value || '';

    if (e.key === 'Enter' && e.shiftKey) {
      e.currentTarget.value = `${value}`;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (userId && value !== userProfile.bio) {
        setUpdating(true);
        showBioToast(value);
        setUserBio(value);
        const updated = await updateUserFieldInDb('bio', value);
        setUpdating(false);
        // if (updated) {
        //   updateSourceUserProfileKey('bio', value);
        // }
      }
    }
  };

  const onUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || '';
    setUserUrl(value);
  };

  const onUrlKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = (e.currentTarget.value || '').trim();
      e.preventDefault();
      e.stopPropagation();
      if (userId && value !== userProfile.url) {
        setUpdating(true);
        showUrlToast(value);
        setUserUrl(shortenUrl(value));
        const updated = await updateUserFieldInDb('url', value);
        setUpdating(false);
        // if (updated) {
        //   updateSourceUserProfileKey('url', value);
        // }
      }
    }
  };

  const onUrlBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = (e.target.value || '').trim();
    if (userId && value !== userProfile.url) {
      // setUpdating(true);
      showUrlToast(value);
      setUserUrl(shortenUrl(value));
      const updated = await updateUserFieldInDb('url', value);
      // setUpdating(false);
      // if (updated) {
      //   updateSourceUserProfileKey('url', value);
      // }
    }
  };

  const onUrlSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || '';
    setUserUrlSocial(value);
  };

  const onUrlSocialKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter') {
      const value = (e.currentTarget.value || '').trim();
      e.preventDefault();
      e.stopPropagation();
      if (userId && value !== userProfile.url) {
        setUpdating(true);
        showUrlSocialToast(value);
        setUserUrlSocial(shortenUrl(value));
        const updated = await updateUserFieldInDb('urlSocial', value);
        setUpdating(false);
        // if (updated) {
        //   updateSourceUserProfileKey('urlSocial', value);
        // }
      }
    }
  };

  const onUrlSocialBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = (e.target.value || '').trim();
    if (userId && value !== userProfile.urlSocial) {
      // setUpdating(true);
      showUrlSocialToast(value);
      setUserUrlSocial(shortenUrl(value));
      const updated = await updateUserFieldInDb('urlSocial', value);
      // setUpdating(false);
      // if (updated) {
      //   updateSourceUserProfileKey('urlSocial', value);
      // }
    }
  };

  const onInterestChange = async (value: string) => {
    if (userId && value !== userProfile.interests?.join(',')) {
      setUpdating(true);
      const formattedValue = value
        ? value
            .split(',')
            .sort()
            .map((v) => v.trim())
            .join(', ')
        : value;
      showInterestToast(formattedValue);
      setInterestValue(formattedValue);

      const updated = await updateUserFieldInDb('interests', formattedValue);

      setUpdating(false);
      // if (updated) {
      //   updateSourceUserProfileKey('interests', formattedValue);
      // }
    }
  };

  const onInterestBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = (e.target.value || '').trim();
    if (userId && value !== userProfile.interests?.join(',')) {
      // setUpdating(true);
      showInterestToast(value);
      setInterestValue(value);
      const updated = await updateUserFieldInDb('interests', value);
      // setUpdating(false);
      // if (updated) {
      //   updateSourceUserProfileKey('interests', value);
      // }
    }
  };

  const onInterestKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const value = (e.currentTarget.value || '').trim();
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (userId && value !== userProfile.interests?.join(',')) {
        setUpdating(true);
        showInterestToast(value);
        setInterestValue(value);
        const updated = await updateUserFieldInDb('interests', value);
        setUpdating(false);
        // if (updated) {
        //   updateSourceUserProfileKey('interests', value);
        // }
      }
    }
  };

  const onProfessionChange = async (value: string) => {
    if (userId && value !== userProfile.profession) {
      setUpdating(true);
      const formattedValue = value
        ? value
            .split(',')
            .sort()
            .map((v) => v.trim())
            .join(', ')
        : value;
      showProfessionToast(formattedValue);
      setProfessionValue(formattedValue);

      const updated = await updateUserFieldInDb('profession', formattedValue);

      setUpdating(false);
      // if (updated) {
      //   updateSourceUserProfileKey('profession', formattedValue);
      // }
    }
  };

  const onOrganizationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || '';
    setOrganizationValue(value);
  };

  const onOrganizationBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = (e.target.value || '').trim();
    if (userId && value !== userProfile.organization) {
      // setUpdating(true);
      showOrganizationToast(value);
      setOrganizationValue(value);
      const updated = await updateUserFieldInDb('organization', value);
      // setUpdating(false);
      // if (updated) {
      //   updateSourceUserProfileKey('organization', value);
      // }
    }
  };

  const onOrganizationKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const value = (e.currentTarget.value || '').trim();
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (userId && value !== userProfile.organization) {
        setUpdating(true);
        showOrganizationToast(value);
        setOrganizationValue(value);
        const updated = await updateUserFieldInDb('organization', value);
        setUpdating(false);
        // if (updated) {
        //   updateSourceUserProfileKey('organization', value);
        // }
      }
    }
  };

  const onLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || '';
    setLocationValue(value);
  };

  const onLocationBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = (e.target.value || '').trim();
    if (userId && value !== userProfile.location) {
      // setUpdating(true);
      showLocationToast(value);
      setLocationValue(value);
      const updated = await updateUserFieldInDb('location', value);
      // setUpdating(false);
      // if (updated) {
      //   updateSourceUserProfileKey('location', value);
      // }
    }
  };

  const onLocationKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const value = (e.currentTarget.value || '').trim();
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (userId && value !== userProfile.location) {
        // setUpdating(true);
        showLocationToast(value);
        setLocationValue(value);
        const updated = await updateUserFieldInDb('location', value);
        // setUpdating(false);
        // if (updated) {
        //   updateSourceUserProfileKey('location', value);
        // }
      }
    }
  };

  const onSelectGeoLocation = async (location: string) => {
    setLocationValue(location);
    if (userId && location !== userProfile.location) {
      setUpdating(true);
      showLocationToast(location);
      setLocationValue(location);
      const updated = await updateUserFieldInDb('location', location);
      setUpdating(false);
      // if (updated) {
      //   updateSourceUserProfileKey('location', location);
      // }
    }
  };

  const onPublicVisibilityChange = async (isVisible: boolean) => {
    setPublicVisibility(isVisible);
    if (userId && isVisible !== userProfile.public) {
      setUpdating(true);
      showProfileVisibilityToast(isVisible);
      setPublicVisibility(isVisible);
      const updated = await updateUserFieldInDb('public', isVisible);
      setUpdating(false);
      // if (updated) {
      //   updateSourceUserProfileKey('public', isVisible);
      // }
    }
  };

  return (
    <form
      action={dispatch}
      ref={formRef}
      className={cn('flex flex-col items-center gap-4 space-y-3', className)}
    >
      <div className="flex w-full flex-col gap-3">
        {!noTitle && (
          <h3 className="text-center text-base font-semibold text-foreground/80">
            {title}
          </h3>
        )}
        <div className="relative flex w-full flex-col gap-3 rounded-lg border bg-secondary/25 p-5 shadow-md">
          <div
            className={cn('flex flex-col gap-2', {
              'pt-6': userAvatar,
            })}
          >
            <Label className="font-medium" htmlFor="name">
              Name {userProfile?.name}
            </Label>
            <div className="relative">
              <Input
                required
                id="name"
                type="text"
                name="name"
                disabled={updating}
                // defaultValue={userName}
                value={userName}
                // value={userProfile?.name}
                onChange={onNameChange}
                onKeyDown={onNameKeyDown}
                onBlur={onNameBlur}
                placeholder="What do you go by?"
                className={cn('', inputClassName, {
                  'border-destructive': !userName,
                })}
              />
            </div>
          </div>

          <div className={cn('flex flex-col gap-2')}>
            <Label
              className="flex items-center gap-1.5 font-medium"
              htmlFor="name"
            >
              <span>About</span>
              <SharedInfoTooltip
                title="Bio"
                content="Share a little about yourself; what's your jam or schtick?"
              />
            </Label>
            <div className="relative">
              <Textarea
                required
                id="bio"
                name="bio"
                maxLength={140}
                disabled={updating}
                // defaultValue={userName}
                value={userBio}
                onBlur={onBioBlur}
                onChange={onBioChange}
                onKeyDown={onBioKeyDown}
                placeholder="In short, what's your jam or schtick?"
                className={cn(
                  'peer max-h-20 min-h-20 resize-none',
                  inputClassName
                )}
              />
              <p className="absolute -bottom-2 right-2 hidden items-center gap-1 text-sm text-muted-foreground peer-focus:flex">
                <span className="sr-only">Press</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="px-1">
                    {userBio.length ? 140 - userBio.length : 140}
                  </span>
                  <span className="flex items-center gap-1">
                    <IconShiftKey /> <span className="">Enter</span>
                  </span>
                </kbd>
              </p>
            </div>
          </div>

          <div className={cn('flex flex-col gap-2')}>
            <Label
              className="flex items-center gap-1.5 font-medium"
              htmlFor="name"
            >
              <span>Profession/Passion</span>
              <SharedInfoTooltip
                title="Profession/Passion"
                content="What do you do or love? We know you're more than just a job title and may wear multiple hats."
              />
            </Label>
            <div className="relative">
              <MultiSelectCombobox
                // name="profession"
                // defaultValue={professionValueItems}
                // options={professions.map((p) => ({
                //   label: p.label,
                //   value: p.value,
                // }))}
                // createName="newGenreName"
                // createLabel="Name:"
                fullWidth
                // disabled={updating}
                inputName="profession"
                onValuesChange={onProfessionChange}
                defaultValue={professionValueItems}
                options={professions}
                className={cn('', inputClassName)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="font-medium" htmlFor="email">
              Email
            </Label>
            <div className="relative">
              <Input
                disabled
                className={cn('', inputClassName)}
                id="email"
                type="email"
                name="email"
                value={userEmail}
                onChange={(e) => {
                  e.preventDefault();
                }}
                placeholder="Enter your email address"
                // defaultValue={user?.email}
                required
              />
            </div>
          </div>
          {/* <div className="flex flex-col gap-2">
            <Label className="font-medium" htmlFor="password">
              Password
            </Label>
            <div className="relative">
              <Input
                className=""
                id="password"
                type="password"
                name="password"
                placeholder="Enter password"
                required
                minLength={6}
              />
            </div>
          </div> */}
          <div className="flex flex-col gap-2">
            <Label className="font-medium" htmlFor="organization">
              Company / Organization
            </Label>
            <div className="relative">
              <Input
                required
                id="organization"
                type="text"
                name="organization"
                disabled={updating}
                value={organizationValue}
                className={cn('', inputClassName)}
                onChange={onOrganizationChange}
                // defaultValue={user?.organization}
                onKeyDown={onOrganizationKeyDown}
                onBlur={onOrganizationBlur}
                placeholder="State of NV, UNR, Redwood, Craft Wine & Beer, etc."
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label
              className="flex items-center gap-1.5 font-medium"
              htmlFor="interests"
            >
              <span>Interests</span>
              <SharedInfoTooltip
                title="Interests"
                content="What do you enjoy doing? Share your hobbies, interests, and passions. This helps personalize your recommended content and experiences."
              />
            </Label>
            <div className="relative">
              <MultiSelectCombobox
                // name="profession"
                // defaultValue={professionValueItems}
                // options={professions.map((p) => ({
                //   label: p.label,
                //   value: p.value,
                // }))}
                // createName="newGenreName"
                // createLabel="Name:"
                fullWidth
                // disabled={updating}
                maxSelections={8}
                inputName="interests"
                btnPlaceholder="Add Interests"
                placeholder="Kayaking, Hiking, Stargazing, etc."
                className={cn('', inputClassName)}
                onValuesChange={onInterestChange}
                defaultValue={interestValueItems}
                options={interests}
              />
              {/* <Input
                required
                className=""
                id="interests"
                type="text"
                name="interests"
                // defaultValue={user?.interests}
                disabled={updating}
                value={interestValue}
                onChange={onInterestChange}
                onKeyDown={onInterestKeyDown}
                onBlur={onInterestBlur}
                placeholder="Kayaking, Hiking, Stargazing, etc."
              /> */}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label
              className="flex items-center gap-1.5 font-medium"
              htmlFor="website"
            >
              <span>Website</span>
              <SharedInfoTooltip
                title="Website"
                content="Your little corner of the internet. Share your personal website, blog, or portfolio or any other link you'd like to share."
              />
            </Label>
            <div className="relative">
              <Input
                required
                id="website"
                type="text"
                name="website"
                // defaultValue={user?.interests}
                disabled={updating}
                value={userUrl}
                className={cn('', inputClassName)}
                onChange={onUrlChange}
                onKeyDown={onUrlKeyDown}
                onBlur={onUrlBlur}
                placeholder="www.best-url-in-the-world.com..."
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label
              className="flex items-center gap-1.5 font-medium"
              htmlFor="social"
            >
              <span>Social</span>
              <SharedInfoTooltip
                title="Social"
                content="Share one of your social media profiles, handles, or usernames where others can connect with you. Useful if you're looking to sell your content or promote your services."
              />
            </Label>
            <div className="relative">
              <Input
                required
                id="social"
                type="text"
                name="social"
                // defaultValue={user?.interests}
                disabled={updating}
                value={userUrlSocial}
                className={cn('', inputClassName)}
                onChange={onUrlSocialChange}
                onKeyDown={onUrlSocialKeyDown}
                onBlur={onUrlSocialBlur}
                placeholder="insta, whatsapp, venmo, etc."
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="font-medium" htmlFor="location">
              Base Location
            </Label>
            <div className="relative">
              <Input
                required
                id="location"
                type="text"
                name="location"
                disabled={updating}
                value={locationValue}
                className={cn('', inputClassName)}
                onChange={onLocationChange}
                // defaultValue={user?.location}
                onKeyDown={onLocationKeyDown}
                onBlur={onLocationBlur}
                placeholder="Reno, Elko, Las Vegas, Baker, etc."
              />
            </div>
            {isPreciseLocation && userLocation && !locationValue && (
              <div className="flex flex-col gap-2">
                <Button
                  size="tiny"
                  variant="secondary"
                  className="gap-1.5 self-start text-sm font-medium"
                  onClick={() => onSelectGeoLocation(userLocation)}
                >
                  <span>Use you current location?</span>{' '}
                  <Badge className="self-center px-1 py-0">
                    {userLocation}
                  </Badge>
                </Button>
              </div>
            )}
          </div>
          <div className="flex flex-row items-center justify-between gap-2">
            <Label className="font-medium" htmlFor="location">
              Profile Visibility
            </Label>

            <div className="flex items-center gap-2">
              <Switch
                required
                className=""
                id="public"
                name="public"
                disabled={updating}
                value={publicVisibility ? 1 : 0}
                checked={publicVisibility}
                onCheckedChange={onPublicVisibilityChange}
              />
              <Badge variant="outline">
                {publicVisibility ? 'Public' : 'Private'}
              </Badge>
            </div>
          </div>
        </div>
        {!noSaveBtn && (
          <SaveProfileButton
            label="Changes Autosave"
            pending={updating}
            disabled
          />
        )}
      </div>
    </form>
  );
}

type SaveProfileButtonProps = {
  disabled: boolean;
  pending?: boolean;
  label?: string;
};

function SaveProfileButton({
  disabled,
  pending: pendingProp,
  label = 'Save Changes',
}: SaveProfileButtonProps) {
  const { pending } = useFormStatus();

  return (
    <ButtonCta
      disabled={disabled || pendingProp || pending}
      aria-disabled={pending || pendingProp}
      className=""
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {pending || pendingProp ? (
        <>
          <IconSpinner />
          <span>Saving...</span>
        </>
      ) : (
        <>{label}</>
      )}
    </ButtonCta>
  );
}
