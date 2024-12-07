import { z } from 'zod';

export const AIGeneratedExperienceSingleTranslationSchema = z.object({
  sourceLanguageCode: z
    .string()
    .describe('Source language code of experience text.'),
  targetLanguageCode: z
    .string()
    .describe('Target language code of experience text.'),
  sourceText: z.string().describe('Source text of experience.'),
  translatedText: z.string().describe('Translated text of experience.'),
  translated: z.boolean().describe('Whether the text was translated.'),
});

export type AIGeneratedExperienceSingleTranslationModel = z.infer<
  typeof AIGeneratedExperienceSingleTranslationSchema
>;

export const AIGeneratedExperienceTranslationSchema = z.object({
  translations: z.array(AIGeneratedExperienceSingleTranslationSchema),
});

export type AIGeneratedExperienceTranslationModel = z.infer<
  typeof AIGeneratedExperienceTranslationSchema
>;
