import { loginGoogle } from '@/app/(auth)/actions';

import { SignInButtonGoogle } from './google-signin-btn';

export type SignInMicrosoftProps = {
  className?: string;
  btnProps?: React.ComponentProps<typeof SignInButtonGoogle>;
};

export function SignInMicrosoft(props: SignInMicrosoftProps) {
  return (
    <form
      className={props.className}
      action={async () => {
        loginGoogle();
      }}
    >
      <SignInButtonGoogle type="submit" {...(props.btnProps || {})} />
    </form>
  );
}
