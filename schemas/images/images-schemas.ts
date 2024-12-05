import { z } from 'zod';

/**
 * Asset source for an image
 */
export const singleImageAssetSourceSchema = z
  .object({
    url: z
      .string()
      .optional()
      .describe(
        `The URL of the source's domain or blog post, not the image URL itself. This can be used to link to the authoring source. E.g. if the image is from a blog post, the URL should be the blog post URL, not the image URL itself`,
      ),
    name: z
      .string()
      .optional()
      .describe(
        'The name of the source. This can be used to attribute the image to the original creator.',
      ),
  })
  .describe('The source of the image asset.');

export type SingleImageAssetSourceType = z.infer<
  typeof singleImageAssetSourceSchema
>;

/**
 * Conversational AI response with image assets
 */
export const singleImageAssetSchema = z.object({
  url: z
    .string()
    .describe(
      'The URL of the image asset. This can be used to display the image in the UI.',
    ),
  alt: z
    .string()
    .optional()
    .describe(
      'Image alt text. Derived from markdown syntax or surrounding image URL text. This is used for accessibility purposes and should describe the image for users who cannot see it.',
    ),
  sources: z.array(singleImageAssetSourceSchema),
});

export type SingleImageAssetType = z.infer<typeof singleImageAssetSchema>;

export const imageAssetListSchema = z.array(singleImageAssetSchema);

export type ImageAssetListType = z.infer<typeof imageAssetListSchema>;

export const generativeImageAssetSchema = z.object({
  assets: imageAssetListSchema.max(3),
});

export type GenerativeImageAssetType = z.infer<
  typeof generativeImageAssetSchema
>;

// Generated Image Assets
export type ParsedGeneratedImgAssets = {
  assets: ImageAssetListType;
  parsed: 'success' | 'error' | 'no';
};
