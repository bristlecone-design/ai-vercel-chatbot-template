import { drizzleAdapter } from '@/lib/db/adapter';
import { getUserByEmail } from '@/lib/db/queries/user';
import type { User as DbUser } from '@/lib/db/schema';
import { deriveUsernameFromEmail } from '@/lib/user/user-utils';
import { compare } from 'bcrypt-ts';
import NextAuth, { type Session, type User } from 'next-auth';
import type { Adapter, AdapterUser } from 'next-auth/adapters';
import Credentials from 'next-auth/providers/credentials';
import GitHub, { type GitHubProfile } from 'next-auth/providers/github';
import Google, { type GoogleProfile } from 'next-auth/providers/google';
import { authConfig } from './auth.config';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  experimental: { enableWebAuthn: true },
  adapter: drizzleAdapter as Adapter,
  // session: { strategy: 'jwt' },
  providers: [
    GitHub({
      checks: ['none'],
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
      // redirectProxyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth`
      async profile(profile = {} as GitHubProfile) {
        // console.log('github profile::', profile);
        // Map the profile to the expected schema in the database
        const username = profile.login;

        const avatar = profile.avatar_url;
        const blogUrl = profile.blog;
        const htmlUrl = profile.html_url;
        const dbUser = {
          username,
          email: profile.email,
          emailVerified: profile.email_verified ? new Date() : null,
          givenName: profile.name,
          familyName: profile.name,
          location: profile.location,
          bio: profile.bio,
          hireable: profile.hireable,
          url: blogUrl || htmlUrl,
          image: avatar,
          avatar: avatar,
          picture: avatar,
          active: true,
          waitlist: true,
          privateBeta: false,
          meta: { github: profile },
        } as DbUser;

        const mappedProfile = { ...profile, ...dbUser } as AdapterUser;
        // console.log('GitHub mappedProfile::', mappedProfile);
        return mappedProfile;
      },
    }),
    Google({
      checks: ['none'],
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
      // redirectProxyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth`
      async profile(profile = {} as GoogleProfile) {
        // console.log('google profile::', profile);
        // Map the profile to the expected schema in the database
        const username = profile.email
          ? deriveUsernameFromEmail(profile.email)
          : null;

        const dbUser = {
          username,
          email: profile.email,
          emailVerified: profile.email_verified ? new Date() : null,
          givenName: profile.given_name,
          familyName: profile.family_name,
          image: profile.picture,
          avatar: profile.picture,
          picture: profile.picture,
          active: true,
          waitlist: true,
          privateBeta: false,
          meta: { google: profile },
        } as DbUser;

        // Create/update the user in the database
        const mappedProfile = { ...profile, ...dbUser } as AdapterUser;
        return mappedProfile;
      },
    }),
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const user = await getUserByEmail(email);

        if (!user) return null;

        const passwordsMatch = await compare(password, user.password!);
        if (!passwordsMatch) return null;
        return user as any;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      // console.log('jwt callback::', { token, user });
      if (user?.id) {
        token.id = user.id;
        token.picture = user.image || null;
        token.name = user.name || null;
        token.username = user.username || null;
        token.privateBeta = user.privateBeta || false;
      }

      return token;
    },
    async session({
      session,
      user,
      token,
    }: {
      session: Session;
      user: User;
      token: any;
    }) {
      // console.log('session callback::', { session, token, user });
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.privateBeta = token.privateBeta as boolean;
      }

      return session;
    },
    // async session({ session, user }) {
    //   session.user.id = user.id;
    //   return session;
    // },
  },
});
