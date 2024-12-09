/**
 *
 * This function truncates a string to a specified number of bytes.
 * In UTF-8, a character can be 1-4 bytes.
 *
 */
export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder('utf-8').decode(enc.encode(str).slice(0, bytes));
};
