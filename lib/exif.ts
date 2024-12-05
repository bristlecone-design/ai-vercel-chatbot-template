import { type ExifData, OrientationTypes } from 'ts-exif-parser';

import { formatNumberToFraction, roundToString } from './number';

const OFFSET_REGEX = /[+-]\d\d:\d\d/;

export const getOffsetFromExif = (data: ExifData) =>
  Object.values(data.tags as any).find(
    (value: any) => typeof value === 'string' && OFFSET_REGEX.test(value),
  ) as string | undefined;

export const getAspectRatioFromExif = (data: ExifData): number => {
  // Using '||' operator to handle `Orientation` unexpectedly being '0'
  const orientation = data.tags?.Orientation || OrientationTypes.TOP_LEFT;

  const width = data.imageSize?.width ?? 3.0;
  const height = data.imageSize?.height ?? 2.0;

  switch (orientation) {
    case OrientationTypes.TOP_LEFT:
    case OrientationTypes.TOP_RIGHT:
    case OrientationTypes.BOTTOM_RIGHT:
    case OrientationTypes.BOTTOM_LEFT:
    case OrientationTypes.LEFT_TOP:
    case OrientationTypes.RIGHT_BOTTOM:
      return width / height;
    case OrientationTypes.RIGHT_TOP:
    case OrientationTypes.LEFT_BOTTOM:
      return height / width;
  }
};

export const formatAperture = (aperture?: number) =>
  aperture ? `ƒ/${roundToString(aperture)}` : undefined;

export const formatIso = (iso?: number) =>
  iso ? `ISO ${iso.toLocaleString()}` : undefined;

export const formatExposureTime = (exposureTime = 0) =>
  exposureTime > 0
    ? exposureTime < 1
      ? `1/${Math.floor(1 / exposureTime)}s`
      : `${exposureTime}s`
    : undefined;

export const formatExposureCompensation = (exposureCompensation?: number) => {
  if (exposureCompensation && Math.abs(exposureCompensation) > 0.01) {
    return `${formatNumberToFraction(exposureCompensation)}ev`;
  } else {
    return undefined;
  }
};

export async function CopyExif(src: Blob, dest: Blob, type = 'image/jpeg') {
  const exif = await retrieveExif(src);
  return new Blob([dest.slice(0, 2), exif, dest.slice(2)], { type });
}

const SOS = 0xffda;
const APP1 = 0xffe1;
const EXIF = 0x45786966;

export const retrieveExif = (blob: Blob): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', (e) => {
      const buffer = e.target!.result as ArrayBuffer;
      const view = new DataView(buffer);
      let offset = 0;
      if (view.getUint16(offset) !== 0xffd8) return reject('not a valid jpeg');
      offset += 2;

      while (true) {
        const marker = view.getUint16(offset);
        if (marker === SOS) break;
        const size = view.getUint16(offset + 2);
        if (marker === APP1 && view.getUint32(offset + 4) === EXIF)
          return resolve(blob.slice(offset, offset + 2 + size));
        offset += 2 + size;
      }
      return resolve(new Blob());
    });
    reader.readAsArrayBuffer(blob);
  });
