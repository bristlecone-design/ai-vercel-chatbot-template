import { loginGitHub } from '@/app/(auth)/actions';

import { SignInButtonGitHub } from './github-signin-btn';

export type SignInGithubProps = {
  btnProps?: React.ComponentProps<typeof SignInButtonGitHub>;
};

export function SignInGithub(props: SignInGithubProps) {
  return (
    <form
      className="w-full"
      action={async () => {
        loginGitHub();
      }}
    >
      <SignInButtonGitHub type="submit" {...(props.btnProps || {})} />
    </form>
  );
}
