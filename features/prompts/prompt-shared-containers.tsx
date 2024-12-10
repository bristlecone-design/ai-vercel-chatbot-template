import type React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  createUserProfileExperienceTabPermalink,
  getUserProfilePermalink,
} from '@/features/experiences/utils/experience-utils';

import { cn } from '@/lib/utils';
import { LinkCta } from '@/components/cta-link';
import { Prose } from '@/components/prose';
import { VideoDrawer } from '@/components/video/video-drawer';

import {
  PopoverWhatArePromptChallenges,
  PopoverWhatArePromptStories,
} from './prompt-shared-popovers';
import { ViewPromptTicker } from './prompt-ticker';

import type { GeneratedExperienceUserPrompt } from '@/types/experience-prompts';
import type { USER_PROFILE_MODEL } from '@/types/user';

export function ChallengePromptProseContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Prose
      className={cn(
        'prose flex w-full max-w-none flex-col gap-4 dark:prose-invert lg:prose-lg prose-h2:my-0 prose-h3:my-0 prose-img:my-0 prose-video:my-0',
        'prose-blockquote:text-lg prose-blockquote:font-semibold prose-blockquote:leading-relaxed prose-blockquote:text-foreground/85 prose-lead:font-medium prose-lead:text-foreground/95 md:prose-blockquote:text-xl',
        className
      )}
    >
      {children}
    </Prose>
  );
}

export function ChallengePageViewSharedContentHeroContainer({
  children,
  className,
  noAspectRatio = false,
  blueGradient = false,
  noGradient = false,
}: {
  children: React.ReactNode;
  className?: string;
  noAspectRatio?: boolean;
  blueGradient?: boolean;
  noGradient?: boolean;
}) {
  let gradientClass = blueGradient
    ? 'from-blue-700 via-blue-700/80 to-blue-700'
    : 'from-green-800 via-green-700 to-green-700/90';

  if (noGradient) {
    gradientClass = '';
  }

  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center',
        'rounded-md',
        'px-4 py-4 sm:py-8',
        'bg-gradient-to-t',
        'animate-animateBackground',
        gradientClass,
        {
          'sm:aspect-video-landscape-wide': !noAspectRatio,
        },
        className
      )}
    >
      {children}
    </div>
  );
}

export async function ChallengePageViewSharedContent({
  children,
  className,
  titleClassName,
  heroClassName,
  heroTitleClassName,
  captionClassName,
  childrenClassName,
  defaultPromptChallenge,
  noChildContainer = false,
  noPromptTicker = false,
  noPromptTooltip = false,
  noAspectRatio = false,
  title = 'Prompt Challenge',
  description = 'We all have an experience to share and discover',
  caption,
}: {
  title?: React.ReactNode;
  titleClassName?: string;
  caption?: React.ReactNode;
  description?: string;
  className?: string;
  heroClassName?: string;
  heroTitleClassName?: string;
  noChildContainer?: boolean;
  noPromptTicker?: boolean;
  noPromptTooltip?: boolean;
  noAspectRatio?: boolean;
  defaultPromptChallenge?: GeneratedExperienceUserPrompt | null;
  childrenClassName?: string;
  captionClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('flex size-full flex-col gap-4', className)}>
      <ChallengePageViewSharedContentHeroContainer
        noAspectRatio={noAspectRatio}
        className={cn('relative w-full gap-8 sm:gap-8', heroClassName)}
      >
        <div className="flex w-full flex-col gap-8">
          <ChallengePromptProseContainer
            className={cn(
              'flex grow flex-col-reverse items-center justify-center gap-1 prose-h1:my-0 prose-h2:text-lg prose-h2:sm:text-xl md:gap-6',
              heroTitleClassName
            )}
          >
            <h1
              className={cn(
                'flex flex-col-reverse items-center justify-center truncate text-center sm:flex-row sm:gap-1.5',
                titleClassName
              )}
            >
              <span className="inline-block">{title}</span>
              {!noPromptTooltip && (
                <PopoverWhatArePromptChallenges
                  noBtnLabel
                  btnClassName="rounded-full hover:bg-white/20"
                  btnIconClassName="size-3 sm:size-4"
                />
              )}
            </h1>
            <h2 className="my-0 max-w-[80%] rounded-2xl px-3 py-0.5 text-center font-normal brightness-90 sm:bg-blue-900/30 sm:dark:bg-green-900/30">
              {description}
            </h2>
          </ChallengePromptProseContainer>
          {caption && (
            <div className={cn('flex justify-center', captionClassName)}>
              {caption}
            </div>
          )}
        </div>
        {!noPromptTicker && (
          <div className="mx-auto flex w-full grow items-start">
            <ViewPromptTicker
              className=""
              defaultPrompt={defaultPromptChallenge}
            />
          </div>
        )}
      </ChallengePageViewSharedContentHeroContainer>
      {children && !noChildContainer && (
        <div
          className={cn(
            'relative mx-auto w-full py-4 sm:max-w-xl sm:py-8',
            childrenClassName
          )}
        >
          {children}
        </div>
      )}
      {children && noChildContainer && children}
    </div>
  );
}

export function ChallengeStoriesBrand({
  logo,
  website,
  className,
}: {
  logo: string;
  website?: string | null;
  className?: string;
}) {
  const logoEl = (
    <span
      className={cn(
        'relative mx-auto flex size-10 justify-center overflow-clip rounded-full transition-all duration-150 hover:rounded',
        className
      )}
    >
      <Image fill src={logo} alt="Story Collection Logo" />
    </span>
  );

  return (
    <span className="flex w-min flex-col items-center justify-center gap-2">
      {website && (
        <a href={website} target="_blank" rel="noopener noreferrer">
          {logoEl}
        </a>
      )}
      {!website && logoEl}
    </span>
  );
}

export function ChallengeStoriesContributingAuthor({
  author,
  className,
}: {
  author: USER_PROFILE_MODEL;
  className?: string;
}) {
  const { image, avatar } = author;
  const avatarSrc = image || avatar;

  if (!avatarSrc) {
    return null;
  }

  const { username } = author;

  const profilePermalnk = username ? getUserProfilePermalink(username) : null;
  const profileExperiencesPermalink = profilePermalnk
    ? createUserProfileExperienceTabPermalink(profilePermalnk)
    : null;

  return (
    <span className="flex w-min flex-col items-center justify-center gap-2">
      <span
        className={cn(
          'relative mx-auto flex size-10 justify-center overflow-clip rounded-full transition-all duration-150 hover:rounded',
          className
        )}
      >
        {!profileExperiencesPermalink && <Image fill src={avatarSrc} alt="" />}
        {profileExperiencesPermalink && (
          <Link href={profileExperiencesPermalink}>
            <Image fill src={avatarSrc} alt="" />
          </Link>
        )}
      </span>
    </span>
  );
}

export async function ChallengeStoriesPageViewSharedContent({
  children,
  className,
  promptPermalink,
  storyPermalink,
  storySeriesTitle = 'Story Series',
  storySeriesTitlePermalink,
  logoClassName,
  titleClassName,
  websiteClassName,
  heroClassName,
  heroTitleClassName,
  videoUrlClassName,
  childrenClassName,
  innerContentClassName,
  noChildContainer = false,
  noPromptTooltip = false,
  noDescription = false,
  noAspectRatio = true,
  author,
  title = 'Prompt Stories',
  description = '',
  videoCaption,
  videoUrl,
  website,
  prompt,
  logo,
}: {
  prompt?: React.ReactNode;
  promptPermalink?: string;
  logo?: string | null;
  logoClassName?: string;
  storyPermalink: string;
  storySeriesTitle?: string;
  storySeriesTitlePermalink?: string;
  website?: string | null;
  websiteClassName?: string;
  videoUrl?: string | null;
  videoCaption?: string | null;
  videoUrlClassName?: string;
  title?: React.ReactNode;
  titleClassName?: string;
  description?: string | null;
  noDescription?: boolean;
  className?: string;
  heroClassName?: string;
  heroTitleClassName?: string;
  innerContentClassName?: string;
  noChildContainer?: boolean;
  noPromptTooltip?: boolean;
  noAspectRatio?: boolean;
  childrenClassName?: string;
  children?: React.ReactNode;
  author?: USER_PROFILE_MODEL;
}) {
  return (
    <div className={cn('flex size-full flex-col gap-4', className)}>
      <ChallengePageViewSharedContentHeroContainer
        blueGradient
        noAspectRatio={noAspectRatio}
        className={cn(
          'relative size-full gap-8 sm:gap-8',
          'from-[#042554] via-[#041E42] to-[#042554]',
          heroClassName
        )}
      >
        <div className="flex w-full flex-col gap-8">
          <ChallengePromptProseContainer
            className={cn(
              'flex grow flex-col items-center justify-center gap-4 transition-all duration-150 prose-h1:my-0 md:gap-6 prose-h2:md:text-3xl prose-h2:md:leading-normal prose-h2:lg:text-5xl prose-h2:lg:leading-snug',
              heroTitleClassName
            )}
          >
            <div
              className={cn(
                'flex w-full flex-col gap-4 sm:max-w-[94%]',
                innerContentClassName
              )}
            >
              <div className="flex w-full flex-col gap-2">
                <h1
                  className={cn(
                    'brightness-70 flex flex-col-reverse items-center justify-center text-center text-sm font-medium sm:flex-row sm:gap-1.5 sm:text-2xl prose-h2:lg:text-5xl prose-h2:lg:leading-snug',
                    titleClassName
                  )}
                >
                  {!storySeriesTitlePermalink && (
                    <span className="inline-block">{storySeriesTitle}</span>
                  )}
                  {storySeriesTitlePermalink && (
                    <Link href={storySeriesTitlePermalink}>
                      <span className="inline-block">{storySeriesTitle}</span>
                    </Link>
                  )}
                  {!noPromptTooltip && (
                    <PopoverWhatArePromptStories
                      noBtnLabel
                      btnClassName="rounded-full hover:bg-white/20"
                      btnIconClassName="size-3 sm:size-4"
                    />
                  )}
                </h1>
                <p className="mx-auto my-0 hidden max-w-fit rounded-2xl bg-white/5 px-3 py-0.5 text-center font-normal text-muted-foreground sm:block lg:my-0">
                  We all have an experience to share and discover
                </p>
              </div>
              <div className="flex w-full flex-col gap-5">
                {prompt && (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div
                      className={cn(
                        'flex w-full min-w-fit flex-col items-center justify-center gap-4 px-3 py-2',
                        'text-center text-2xl font-semibold md:text-4xl md:leading-normal xl:text-5xl xl:font-medium xl:leading-normal',
                        'rounded-2xl border-4 border-double border-foreground/35',
                        'bg-secondary/30 hover:border-foreground/60 hover:bg-secondary/50'
                      )}
                    >
                      {prompt && promptPermalink && (
                        <Link
                          href={promptPermalink}
                          className="link-primary no-underline hover:no-underline"
                        >
                          <span className="inline-block">{prompt}</span>
                        </Link>
                      )}
                      {!promptPermalink && <span>{prompt}</span>}
                    </div>
                    {storyPermalink && (
                      <LinkCta
                        href={storyPermalink}
                        variant="plain"
                        size="sm"
                        className="sr-only h-[unset] text-base font-normal text-foreground/80 hover:bg-white/5"
                      >
                        More story prompts
                      </LinkCta>
                    )}
                  </div>
                )}
                <h2
                  className={cn(
                    'flex flex-col-reverse items-center justify-center text-center sm:flex-row sm:gap-1.5',
                    titleClassName
                  )}
                >
                  <Link
                    href={storyPermalink}
                    className="link-primary no-underline hover:no-underline"
                  >
                    <span className="inline-block">{title}</span>
                  </Link>
                </h2>
                {description && !noDescription && (
                  <p className="lead mx-auto my-0 max-w-fit rounded-2xl py-1 text-center text-lg leading-normal text-foreground/80 brightness-90 hover:brightness-100 sm:px-0 lg:my-0">
                    {description}
                  </p>
                )}
                {(logo || videoUrl || author) && (
                  <div className="flex w-full items-center justify-center gap-3">
                    {logo && (
                      <ChallengeStoriesBrand logo={logo} website={website} />
                    )}

                    {videoUrl && (
                      <VideoDrawer
                        src={videoUrl}
                        title={title}
                        description={description}
                        caption={videoCaption}
                        footerCloseLabel="Return to Story Series"
                      />
                    )}

                    {author && (
                      <ChallengeStoriesContributingAuthor author={author} />
                    )}
                  </div>
                )}
              </div>
            </div>
          </ChallengePromptProseContainer>
        </div>
      </ChallengePageViewSharedContentHeroContainer>
      {children && !noChildContainer && (
        <div
          className={cn(
            'relative mx-auto w-full py-4 sm:max-w-4xl sm:py-8',
            childrenClassName
          )}
        >
          {children}
        </div>
      )}
      {children && noChildContainer && children}
    </div>
  );
}
