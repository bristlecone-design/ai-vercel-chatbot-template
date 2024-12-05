export function pathToRouteUserByEmail(email: string) {
  let path = null;

  if (!email) {
    return path;
  }

  if (
    email.includes('tmcc') ||
    email.includes('unr') ||
    email.includes('dri')
  ) {
    path = `/tmcc`;
  }

  return path;
}
