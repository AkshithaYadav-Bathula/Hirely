// Frontend-safe exports
// Access environment variables via import.meta.env (Vite) or process.env (CRA)

export const AWS_ACCESS_KEY_ID = import.meta.env.VITE_AWS_ACCESS_KEY_ID || '';
export const AWS_SECRET_ACCESS_KEY = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '';
export const AWS_BUCKET = import.meta.env.VITE_AWS_BUCKET || '';
export const AWS_REGION = import.meta.env.VITE_AWS_REGION || '';
export const VIDEO_FILE_SIZE_LIMIT = Number(import.meta.env.VITE_VIDEO_FILE_SIZE_LIMIT) || 50 * 1024 * 1024;
export const VIDEO_INPUT_S3_URL = import.meta.env.VITE_VIDEO_INPUT_S3_URL || '';
export const VIDEO_DELETE_S3_URL = import.meta.env.VITE_VIDEO_DELETE_S3_URL || '';
