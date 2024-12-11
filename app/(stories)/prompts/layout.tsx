import { DiscoveryBgImageContainer } from '@/components/bg-image-random-client';
import { PrimaryContentContainer } from '@/components/layout-containers';

interface ChallengeLayoutProps {
  children: React.ReactNode;
}

export default async function ChallengeLayout(props: ChallengeLayoutProps) {
  // console.log('**** ChallengeLayout props invoked', props);
  const { children } = props;
  return (
    <DiscoveryBgImageContainer>
      <div className="w-full overflow-auto pl-0 duration-300 ease-in-out animate-in">
        <PrimaryContentContainer
          className="z-auto h-full pb-0"
          innerContainerClassName="bg-background text-foreground sm:rounded-2xl relative p-4 sm:p-4 h-full"
        >
          {children}
        </PrimaryContentContainer>
      </div>
    </DiscoveryBgImageContainer>
  );
}
//
