'use client';

import { useRouter, useSearchParams } from 'next/navigation';

type UrlParamState = {
  [key: string]: string;
} & {
  // Add more keys here
};

/**
 * Hook to get the initial state from the URL.
 */
export const useGetInitialState = () => {
  const searchParams = useSearchParams();

  const params: UrlParamState = {};
  for (const [key, value] of searchParams.entries()) {
    if (value) {
      params[key] = value;
    }
  }

  return params;
};

/**
 * Hook to update the URL with the current state of parameters.
 */
export function useUpdateURL() {
  const router = useRouter();

  return (state: UrlParamState) => {
    const newParams = new URLSearchParams(window.location.search);

    for (const [key, value] of Object.entries(state)) {
      if (!value) {
        newParams.delete(key);
        continue;
      }

      newParams.set(key, value);
    }

    router.push(`?${newParams.toString()}`, { scroll: false });
  };
}
