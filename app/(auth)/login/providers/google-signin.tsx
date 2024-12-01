import { loginGoogle } from '@/app/(auth)/actions';

import { SignInButtonGoogle } from './google-signin-btn';

export type SignInGoogleProps = {
  btnProps?: React.ComponentProps<typeof SignInButtonGoogle>;
};

export function SignInGoogle(props: SignInGoogleProps) {
  return (
    <form
      className="w-full"
      action={async () => {
        loginGoogle();
      }}
    >
      <SignInButtonGoogle type="submit" {...(props.btnProps || {})} />
    </form>
  );
}
