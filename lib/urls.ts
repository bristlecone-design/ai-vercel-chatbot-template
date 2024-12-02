export function getUrlPathname(url: string | URL) {
  if (typeof url === 'string') {
    return new URL(url).pathname;
  }

  if (url instanceof URL) {
    return url.pathname;
  }

  if (window) {
    return new URL(window.location.href).pathname;
  }

  return '/';
}

/**
 * Returns the absolute URL for a given path using the app's specified base URL, e.g. /about -> https://example.com/about
 */
export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
}

/**
 * Add protocol to url and remove trailing slash
 */
export const makeUrlAbsolute = (url = '') =>
  (!url.startsWith('http') ? `https://${url}` : url).replace(/\/$/, '');

/**
 * Shortens a URL by removing the protocol and www, e.g. https://www.example.com -> example.com
 */
export const shortenUrl = (url?: string) =>
  url ? url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').replace(/\/$/, '') : '';

/**
 * Removes the protocol from a URL, e.g. https://example.com -> example.com
 */
export const removeUrlProtocol = (url: string) =>
  url ? url.replace(/^(?:https?:\/\/)?/i, '').replace(/\/$/, '') : '';
