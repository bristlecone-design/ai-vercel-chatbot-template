/**
 * Determines if we're in a browser environment (client-side)
 */
export const isBrowser = () => typeof window !== 'undefined';

/**
 * Scroll to top of page on client side navigation
 */
export const scrollToTop = (top = 0, behavior: ScrollBehavior = 'smooth') => {
  if (isBrowser()) {
    window.scrollTo({
      top,
      behavior,
    });
  }
};

/**
 * Scroll to an element on the page
 */
export const scrollToElement = (
  element: HTMLElement,
  block: ScrollLogicalPosition = 'end',
  behavior: ScrollBehavior = 'smooth'
) => {
  if (isBrowser()) {
    element.scrollIntoView({
      block,
      behavior,
    });
  }
};
