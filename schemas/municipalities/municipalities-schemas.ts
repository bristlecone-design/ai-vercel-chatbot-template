import { z } from 'zod';

/**
 * Municipalities
 */
export const singleMunicipalitySchema = z.string().describe(`
  Single municipality (city or town) name mentioned in the user prompt, context and or AI response, e.g. Las Vegas, Reno, Tonopah, etc. Don't include the state name or a geographical region of the municipality, just the city or town name.`);

export type SingleMunicipalityType = z.infer<typeof singleMunicipalitySchema>;

export const municipalityListSchema = z.array(singleMunicipalitySchema);

export type MunicipalityListType = z.infer<typeof municipalityListSchema>;

/**
 * State
 */
export const singleStateSchema = z
  .string()
  .describe(
    `
  Single state mentioned in the user prompt, context and or AI response, e.g. Nevada, California, Texas, etc.`,
  )
  .default('Nevada');

export type SingleStateType = z.infer<typeof singleStateSchema>;
