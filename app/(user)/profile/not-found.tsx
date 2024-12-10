import { ChallengePageViewSharedContent } from '@/features/prompts/prompt-shared-containers';

export default function ChallengeSinglePromptNotFoundPage() {
  return (
    <ChallengePageViewSharedContent
      noPromptTicker
      noPromptTooltip
      title={<span>But Right Now...We Hit a Bump</span>}
      // heroClassName={!promptFound ? 'bg-gray-100' : undefined}
    >
      Not found
    </ChallengePageViewSharedContent>
  );
}
