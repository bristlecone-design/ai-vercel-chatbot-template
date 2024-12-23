import { useState } from 'react';

import { formHasTextContent } from '.';
import { AiAutoGeneratedField } from '../ai';
import useAiImageQueries from '../ai/useAiImageQueries';

import { PhotoFormData } from '@/types/photo';

export default function usePhotoFormParent({
  photoForm,
  textFieldsToAutoGenerate,
  imageThumbnailBase64,
}: {
  photoForm?: Partial<PhotoFormData>;
  textFieldsToAutoGenerate?: AiAutoGeneratedField[];
  imageThumbnailBase64?: string;
}) {
  const [pending, setIsPending] = useState(false);
  const [updatedTitle, setUpdatedTitle] = useState('');
  const [hasTextContent, setHasTextContent] = useState(
    photoForm ? formHasTextContent(photoForm) : false
  );

  const aiContent = useAiImageQueries(
    textFieldsToAutoGenerate,
    imageThumbnailBase64
  );

  return {
    pending,
    setIsPending,
    updatedTitle,
    setUpdatedTitle,
    hasTextContent,
    setHasTextContent,
    aiContent,
  };
}
