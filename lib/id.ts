import { customAlphabet } from 'nanoid';

/**
 * General nano ID generator and wrapper.
 */
export const nanoid = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyz',
  10,
);

/**
 * Generates a unique ID with the provided prefix.
 * @param pfx - The prefix to use for the generated ID.
 * @returns A unique ID in the format `{pfx}_{randomId}`.
 */
export function genId(pfx: string) {
  return [pfx, nanoid()].join('_');
}

/**
 * Generates a random 6-digit number as a string.
 * @returns A 6-digit string representation of a random number.
 */
export function generateRandomSixDigitNumber(): string {
  const randomNum = Math.floor(Math.random() * 1000000);
  const randomSixDigitStr = randomNum.toString().padStart(6, '0');
  return randomSixDigitStr;
}
