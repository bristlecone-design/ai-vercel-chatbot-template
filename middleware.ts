import { auth } from '@/app/(auth)/auth-edge';

export default auth;

export const config = {
  matcher: ['/', '/:id', '/login', '/register'],
};
