import { screens } from '@/tailwind.screens';
import { useMedia } from 'react-use';

// Inspiration: https://github.com/tailwindlabs/tailwindcss/discussions/3822

export const breakpoints = {
  ...screens,
};

// Get the type of the breakpoints
// export type breakpoints = keyof typeof breakpoints;
type BreakpointKey = keyof typeof breakpoints;

// export const useBreakpoint = createBreakpoint(
//   breakpoints
// ) as () => keyof typeof breakpoints;

export function useBreakpoint<K extends BreakpointKey>(breakpointKey: K) {
  const bool = useMedia(`(min-width: ${breakpoints[breakpointKey]})`);
  const capitalizedKey =
    breakpointKey[0].toUpperCase() + breakpointKey.substring(1);
  type Key = `is${Capitalize<K>}`;
  return {
    [`is${capitalizedKey}`]: bool,
  } as Record<Key, boolean>;
}
