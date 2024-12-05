export function removeTrailingParamFromImageUrl(
  imageUrl: string | undefined = '',
) {
  let mappedImageUrl = imageUrl;
  if (imageUrl?.endsWith('s=60')) {
    mappedImageUrl = imageUrl.replace('s=60', '');
  }
  return mappedImageUrl;
}
