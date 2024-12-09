export const DEFAULT_FILE_UPLOAD_KEY = 'file';

export const DEFAULT_FILES_UPLOAD_KEY = 'files';

export function createFormDataFromFiles(
  files: File[],
  formKey = DEFAULT_FILES_UPLOAD_KEY,
) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append(formKey, file);
  });
  return formData;
}

export function getAllFilesFromFormData(
  formData: FormData,
  formKey = DEFAULT_FILES_UPLOAD_KEY,
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
