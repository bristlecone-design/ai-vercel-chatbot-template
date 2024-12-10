import type { Session } from 'next-auth';

export type ProfileTabProps = {
  userName: string;
  children?: React.ReactNode;
  className?: string;
};

export type ProfilePageProps = {
  params: Promise<{ userName: ProfileTabProps['userName'] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  children?: React.ReactNode;
  session?: Session;
};

export type ProfileSingleExperienceProps = {
  params: Promise<{ userName: ProfileTabProps['userName']; expId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  children?: React.ReactNode;
};
