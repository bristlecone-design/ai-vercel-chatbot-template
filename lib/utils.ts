import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function capitalize(str: string) {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const truncate = (str: string, length: number) => {
  if (!str || str.length <= length) return str;
  return `${str.slice(0, length)}...`;
};

/**
 * Remove surrounding double-quotes from a string
 */
export const removeQuotes = (str: string) => {
  return str.replace(/['"]+/g, '');
};

/**
 * Random number between min and max
 */
export const randomRange = (min = 0, max = 0) => {
  if (!min && !max) return;
  if (min > max) throw new Error('Min cannot be greater than max');

  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const parseObject = (obj: string | object) => {
  if (typeof obj === 'string') {
    return JSON.parse(obj);
  }

  return obj;
};

// No operation
export const noop = () => {};

// Simulate an await for a given number of milliseconds
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const logJSON = (data: any, prefix = '') => {
  console.log(prefix, JSON.stringify(data, null, 2), '\n');
};

export const simulateLongRequest = async (
  requestName: string,
  durationInSeconds: number,
) => {
  for (let i = 0; i < durationInSeconds; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(`${requestName} request ${i + 1} of ${durationInSeconds}`);
  }
};
