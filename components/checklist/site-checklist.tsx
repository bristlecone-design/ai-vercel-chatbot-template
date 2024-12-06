import { generateAuthSecret } from '@/app/(auth)/auth-edge';

import SiteChecklistClient from './site-checklist-client';

import { CONFIG_CHECKLIST_STATUS } from '@/config/site-settings';

export default async function SiteChecklist({
  simplifiedView,
}: {
  simplifiedView?: boolean;
}) {
  const secret = await generateAuthSecret();
  return (
    <SiteChecklistClient
      {...{
        ...CONFIG_CHECKLIST_STATUS,
        simplifiedView,
        secret,
      }}
    />
  );
}
