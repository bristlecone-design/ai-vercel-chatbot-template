'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OnboardingUploadNVImages } from '@/components/content/assets/onboarding-upload-nv-images';

import { UserProfileForm } from './user-profile-form';

import type { PhotoBasicExifData } from '@/types/photo';
import type { USER_PROFILE_MODEL } from '@/types/user';

export type UserProfileOnboardingTabsProps = {
  user: USER_PROFILE_MODEL;

  className?: string;
  uploadedAssets?: PhotoBasicExifData[];
};

export function UserProfileOnboardingTabs({
  uploadedAssets = [],
  className,
  user,
}: UserProfileOnboardingTabsProps) {
  const userId = user.id!;
  return (
    <Tabs
      defaultValue="featured"
      onValueChange={(value) => {
        // console.log('tab value changed', value);
      }}
      className={cn('w-full', className)}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="featured">Share NV Pics</TabsTrigger>
        <TabsTrigger value="profile">My Profile</TabsTrigger>
      </TabsList>
      <TabsContent value="featured">
        <Card className="border-0">
          {/* <CardHeader>
            <CardTitle className="sr-only">File Upload</CardTitle>
          </CardHeader> */}
          <CardContent className="p-0">
            <OnboardingUploadNVImages
              noMaxNumFiles={String(user.id) === '111233296'}
              uploadedAssets={uploadedAssets}
              user={user}
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="profile">
        <Card className="border-0">
          {/* <CardHeader>
            <CardTitle className="sr-only">URL & Web Content</CardTitle>
          </CardHeader> */}
          <CardContent className="p-0">
            <UserProfileForm
              noTitle
              user={user as USER_PROFILE_MODEL}
              userId={user.id!}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
