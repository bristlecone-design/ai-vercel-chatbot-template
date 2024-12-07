import { SWRConfig } from 'swr';

export function SwrConfigClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SWRConfig
      value={{
        suspense: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
