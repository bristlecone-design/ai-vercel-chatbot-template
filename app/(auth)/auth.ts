import { drizzleAdapter } from '@/lib/db/adapter';
import { getUser } from '@/lib/db/queries';
import type { User as DbUser } from '@/lib/db/schema';
import { compare } from 'bcrypt-ts';
import NextAuth, { type Session, type User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub, { type GitHubProfile } from 'next-auth/providers/github';
import Google, { type GoogleProfile } from 'next-auth/providers/google';
import { authConfig } from './auth.config';
interface ExtendedSession extends Session {
  user: User;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  experimental: { enableWebAuthn: true },
  adapter: drizzleAdapter,
  session: { strategy: 'jwt' },
  providers: [
    GitHub({
      checks: ['none'],
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
      // redirectProxyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth`
      async profile(profile = {} as GitHubProfile) {
        console.log('github profile::', profile);
        // Map the profile to the expected schema in the database
        const username = profile.login;
        const avatar = profile.avatar_url;
        const dbUser = {
          username,
          email: profile.email,
          emailVerified: profile.email_verified ? new Date() : null,
          givenName: profile.name,
          familyName: profile.name,
          location: profile.location,
          bio: profile.bio,
          hireable: profile.hireable,
          image: avatar,
          avatar: avatar,
          picture: avatar,
          active: true,
          waitlist: true,
          privateBeta: false,
          meta: { github: profile },
        } as DbUser;
        return { ...profile, ...dbUser } as any;
      },
    }),
    Google({
      checks: ['none'],
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
      // redirectProxyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth`
      async profile(profile = {} as GoogleProfile) {
        console.log('google profile::', profile);
        // Map the profile to the expected schema in the database
        const username = profile.email?.split('@')[0];
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
        return { ...profile, ...dbUser } as any;
      },
    }),
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);
        if (users.length === 0) return null;
        // biome-ignore lint: Forbidden non-null assertion.
        const passwordsMatch = await compare(password, users[0].password!);
        if (!passwordsMatch) return null;
        return users[0] as any;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      console.log('jwt callback::', { token, user });
      if (user) {
        token.id = user.id;
        token.picture = user.image || null;
        token.name = user.name || null;
      }

      return token;
    },
    async session({
      session,
      user,
      token,
    }: {
      session: ExtendedSession;
      user: User;
      token: any;
    }) {
      console.log('session callback::', { session, token, user });
      if (session.user) {
        session.user.id = token.id as string;
      }

      return session;
    },
    // async session({ session, user }) {
    //   session.user.id = user.id;
    //   return session;
    // },
  },
});
