'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { AuthForm } from '@/components/auth/auth-form';
import { SignInGithub } from '@/components/auth/login/github-signin';
import { SignInGoogle } from '@/components/auth/login/google-signin';
import { SubmitButton } from '@/components/submit-button';

import { loginCredentials, type LoginActionState } from '@/app/(auth)/actions';

// import { loginCredentials, type LoginActionState } from '../actions';

export type LoginEmailFormProps = {
  className?: string;
  title?: string;
  redirectPath?: string;
};

export function LoginEmailForm({
  redirectPath,
  className,
  title = 'Sign In to Experience Nevada',
}: LoginEmailFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    loginCredentials,
    {
      status: 'idle',
    }
  );

  useEffect(() => {
    if (state.status === 'failed') {
      toast.error('Invalid credentials!');
    } else if (state.status === 'invalid_data') {
      toast.error('Failed validating your submission!');
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      if (redirectPath) {
        router.push(redirectPath);
      }
      router.refresh();
    }
  }, [state.status, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div
      className={cn(
        'flex w-full max-w-xl flex-col gap-8 overflow-hidden rounded-3xl bg-background/95 p-8',
        className
      )}
    >
      <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>
      <div className="flex w-full flex-col items-stretch gap-2">
        <div className="flex w-full flex-row items-center justify-center gap-4">
          <SignInGithub />
          <SignInGoogle />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Separator className="max-w-[15%]" />
        <span className="uppercase">Or</span>
        <Separator className="max-w-[15%]" />
      </div>

      <div className="flex w-full max-w-xl flex-col items-center gap-6">
        <p className="text-muted-foreground">
          Use your email and password to sign in
        </p>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
          <p className="text-center text-sm text-muted-foreground">
            {"Don't have an account? "}
            <Link href="/register" className="font-semibold hover:underline">
              Sign up
            </Link>
            {' for free.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
