import { LoginEmailForm } from '@/components/auth/login/login-form-email';
import { DiscoveryRandomBgImage } from '@/components/bg-image-random-client';

export default function Page() {
  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background/65 pt-12 sm:items-center md:pt-0">
      <DiscoveryRandomBgImage className="" />
      <LoginEmailForm />
    </div>
  );
}
