import { Camera } from '@/camera';
import PhotoOGTile from '@/photo/PhotoOGTile';
import { FilmSimulation } from '@/simulation';

import ShareModal from '@/components/share-photo';

import { Photo } from '.';

import { absolutePathForPhoto, pathForPhoto } from '@/config/site-paths';

export default function PhotoShareModal(props: {
  photo: Photo;
  tag?: string;
  camera?: Camera;
  simulation?: FilmSimulation;
  focal?: number;
}) {
  return (
    <ShareModal
      pathShare={absolutePathForPhoto(props)}
      pathClose={pathForPhoto(props)}
      socialText="Check out this photo"
    >
      <PhotoOGTile photo={props.photo} />
    </ShareModal>
  );
}
