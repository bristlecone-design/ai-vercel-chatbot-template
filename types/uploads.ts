export type UserExperienceUploadParams = {
  fileName: string;
  fileNamePrefix: string;
  contentType: string;
  publicAccess: boolean;
  prefix: string; // The folder to upload the file to
  bypassAuth: boolean;
};
