import type { Attachment } from 'ai';
import { toast } from 'sonner';

export const uploadFileFetch = async (file: File | Blob) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      const { url, pathname, contentType } = data;

      return {
        url,
        name: pathname,
        contentType: contentType,
      } as Attachment;
    }
    const { error } = await response.json();
    toast.error(error);
  } catch (error) {
    toast.error('Failed to upload file, please try again!');
  }
};

export const removeFileFetch = async (attachment: Attachment) => {
  const formData = new FormData();
  formData.append('url', attachment.url);

  try {
    const response = await fetch(`/api/files/upload`, {
      method: 'DELETE',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      const { url, success } = data;

      return {
        url,
        success,
      } as { url: string; success: boolean };
    }
    const { error } = await response.json();
    toast.error(error);
  } catch (error) {
    toast.error('Failed to upload file, please try again!');
  }
};

export const transcribeAudioFileFetch = async (file: File | Blob) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/chat/audio/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      const { transcribed, tanscription, error } = data;

      return { transcribed, tanscription, error } as {
        transcribed: boolean;
        tanscription: string;
        error?: string;
      };
    }

    const { error } = await response.json();

    throw new Error(error);
  } catch (error) {
    toast(`Failed to transcribe audio file: ${error}`);
  }
};
