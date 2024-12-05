// Core paths
export const PATH_ROOT = '/';
export const PATH_GRID = '/grid';
export const PATH_ADMIN = '/admin';
export const PATH_API = '/api';
export const PATH_SIGN_IN = '/login';
export const PATH_OG = '/og';

// Path prefixes
export const PREFIX_PHOTO = '/photo';
export const PREFIX_TAG = '/tag';
export const PREFIX_CAMERA = '/shot-on';
export const PREFIX_FILM_SIMULATION = '/film';
export const PREFIX_FOCAL_LENGTH = '/focal';

// Dynamic paths
const PATH_PHOTO_DYNAMIC = `${PREFIX_PHOTO}/[photoId]`;
const PATH_TAG_DYNAMIC = `${PREFIX_TAG}/[tag]`;
const PATH_CAMERA_DYNAMIC = `${PREFIX_CAMERA}/[make]/[model]`;
// eslint-disable-next-line max-len
const PATH_FILM_SIMULATION_DYNAMIC = `${PREFIX_FILM_SIMULATION}/[simulation]`;
const PATH_FOCAL_LENGTH_DYNAMIC = `${PREFIX_FOCAL_LENGTH}/[focal]`;

// Admin paths
export const PATH_ADMIN_PHOTOS = `${PATH_ADMIN}/photos`;
export const PATH_ADMIN_UPLOADS = `${PATH_ADMIN}/uploads`;
export const PATH_ADMIN_TAGS = `${PATH_ADMIN}/tags`;
export const PATH_ADMIN_CONFIGURATION = `${PATH_ADMIN}/configuration`;
export const PATH_ADMIN_BASELINE = `${PATH_ADMIN}/baseline`;

// Debug paths
export const PATH_OG_ALL = `${PATH_OG}/all`;
export const PATH_OG_SAMPLE = `${PATH_OG}/sample`;

// API paths
export const PATH_API_STORAGE = `${PATH_API}/storage`;
export const PATH_API_VERCEL_BLOB_UPLOAD = `${PATH_API_STORAGE}/vercel-blob`;
export const PATH_API_PRESIGNED_URL = `${PATH_API_STORAGE}/presigned-url`;

// Modifiers
const SHARE = 'share';
const EDIT = 'edit';

export const PATHS_ADMIN = [
  PATH_ADMIN,
  PATH_ADMIN_PHOTOS,
  PATH_ADMIN_UPLOADS,
  PATH_ADMIN_TAGS,
  PATH_ADMIN_CONFIGURATION,
];

// Add other paths here (@see original exp nv repo for migration of this info)
