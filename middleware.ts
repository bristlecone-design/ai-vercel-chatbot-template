import { auth } from '@/app/(auth)/auth-edge';

const rootPath = '/';
const loginPath = '/login';
const registerPath = '/register';

export default auth((req) => {
  const { auth, nextUrl } = req;
  const { pathname: nextPathname } = nextUrl;

  const isAuth = !!auth?.user;
  const isLoggedIn = isAuth;
  const isRootPath = nextPathname === rootPath;
  const isLoginPath = nextPathname === loginPath;
  const isRegisterPath = nextPathname === registerPath;
  // console.log('Auth in middleware', { auth, nextPathname, isLoggedIn });

  // Redirect to login path if user is not logged in and tries to access root path
  if (!isLoggedIn && isRootPath) {
    return Response.redirect(new URL(loginPath, nextUrl));
  }

  // Redirect to root path if user is logged in and tries to access login or register pages
  if (isLoggedIn && (isLoginPath || isRegisterPath)) {
    return Response.redirect(new URL(rootPath, nextUrl));
  }

  return;
});

export const config = {
  matcher: [
    '/((?!api|static|share|reset|public|waitlist|fonts|_next/static|sitemap|robots|manifest|favicon|apple-icon|apple-touch|opengraph-image|twitter-image|.*\\.png$).*)',
  ],
};
