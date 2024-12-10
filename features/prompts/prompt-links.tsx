import Link from 'next/link';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { IconSparkle } from '@/components/ui/icons';

export type ViewAllPromptChallengesProps = {
  iconClassName?: string;
  className?: string;
  label?: string;
  href?: string;
};

export function ViewAllPromptChallenges({
  className,
  iconClassName,
  label = 'View All Prompt Challenges',
  href = '/prompts',
}: ViewAllPromptChallengesProps) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({
          variant: 'default',
          className:
            'group gap-1 ring-offset-2 transition-none duration-75 hover:bg-amber-700 hover:text-foreground hover:ring-2 hover:ring-foreground',
        }),
        className
      )}
    >
      <IconSparkle
        className={cn(
          'size-4 transition-transform group-hover:rotate-180',
          iconClassName
        )}
      />
      <span>{label}</span>
    </Link>
  );
}
