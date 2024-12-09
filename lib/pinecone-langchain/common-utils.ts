import type { CrawledPage } from './metadata';

export const DEFAULT_FILE_UPLOAD_KEY = 'files';

export function createFormDataFromFiles(
  files: File[],
  formKey = DEFAULT_FILE_UPLOAD_KEY,
) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append(formKey, file);
  });
  return formData;
}

export function getAllFilesFromFormData(
  formData: FormData,
  formKey = DEFAULT_FILE_UPLOAD_KEY,
) {
  const files: File[] = [];
  for (const [key, value] of formData.entries()) {
    if (key === formKey) {
      const file = value as File;
      files.push(file);
    }
  }
  return files;
}

/**
 * Convert a File to a Blob or String
 *
 * @param file - The File to convert
 * @returns The Blob of the File or the File(path) as a string
 */
export function fileToBlobOrString(file: File): Blob | string {
  if (file instanceof Blob) return file;
  if (typeof file === 'string') return file;

  // At this point, we know it's a File
  const xFile = file as File;

  return new Blob([xFile], { type: xFile.type });
}

/**
 * Get the extension of a file path in lowercase
 *
 * @param path - The path to get the extension of
 * @returns The lowercased extension of the file path
 */
export function lowercasePathExtension(path: string): string {
  return path.toLowerCase().split('.').pop() || '';
}

/**
 * Standardize a file's extension to lowercase
 *
 * @param path - The path to standardize
 * @returns The path with a lowercase extension
 */
export function standardizeFileExtension(path: string): string {
  const pathParts = path.split('.');

  pathParts.pop(); // Remove the old extension
  const newExtension = lowercasePathExtension(path);

  return `${pathParts.join('.')}.${newExtension}`;
}

/**
 * Map a File's type to the source type
 *
 * @param file - The File to map
 * @returns The source type of the File, e.g. 'web', 'pdf', 'word', 'text', 'csv', etc.
 */
export function mapFileTypeToSourceType(file: File): CrawledPage['sourceType'] {
  const fileType = file.type;

  if (fileType.includes('pdf')) return 'pdf';
  if (fileType.includes('word')) return 'docx';
  if (fileType.includes('plain')) return 'txt';
  if (fileType.includes('csv')) return 'csv';
  if (fileType.includes('markdown')) return 'mdx';
  if (fileType.includes('mdx')) return 'mdx';
  if (fileType.includes('md')) return 'md';
  if (fileType.includes('htm')) return 'html';
  if (fileType.includes('m4a')) return 'm4a';
  if (fileType.includes('mpeg')) return 'mpeg';
  if (fileType.includes('image')) return 'img';
  return 'file';
}

/**
 * Map a filepath's extension to the source type
 *
 * @param path - The path to map
 * @returns The source type of the path, e.g. 'web', 'pdf', 'word', 'text', 'csv', etc.
 */
export function mapFilePathToSourceType(
  path: string,
): CrawledPage['sourceType'] {
  const extension = path.split('.').pop();
  if (extension === 'pdf') return 'pdf';
  if (extension === 'docx') return 'docx';
  if (extension === 'txt') return 'txt';
  if (extension === 'csv') return 'csv';
  if (extension === 'mdx') return 'mdx';
  if (extension === 'md') return 'md';
  if (extension === 'htm' || extension === 'html') return 'html';
  return 'file';
}

/**
 * Remove duplicate entries from an array
 *
 * @param arr - The array to remove duplicates from
 * @returns The array with duplicates removed
 */
export function removeDuplicatesFromArray<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
